Imports System.Drawing
Imports Guinayang_Guidance_Tracking_and_Management_System.Templates

Public Class ViewRep

#Region "Fields & Initialization"
    Private drag As Boolean
    Private mouseX As Integer
    Private mouseY As Integer
    Private reportId As String
    Private loadedReport As IncidentReport
    Private currentImageIndex As Integer = 0
    Public Property CurrentRole As String

    ' Bundled stand-in images for report attachments (demo build has no cloud storage).
    Private Shared ReadOnly PlaceholderPool As System.Drawing.Image() = {
        My.Resources.images, My.Resources.file_solid1, My.Resources.triangle_exclamation_solid
    }

    Public Sub New(reportKey As String)
        InitializeComponent()
        reportId = reportKey
    End Sub

    Private Function ResolveAttachmentImage(key As String, index As Integer) As System.Drawing.Image
        If Not String.IsNullOrWhiteSpace(key) Then
            Dim img = TryCast(My.Resources.ResourceManager.GetObject(key), System.Drawing.Image)
            If img IsNot Nothing Then Return img
        End If
        Return PlaceholderPool(Math.Abs(index) Mod PlaceholderPool.Length)
    End Function

    ''' <summary>Assign PictureBox1.Image, disposing the previous one unless it is a shared resource bitmap.</summary>
    Private Sub SetPreviewImage(img As System.Drawing.Image)
        Dim old = PictureBox1.Image
        PictureBox1.Image = img
        If old IsNot Nothing AndAlso Not ReferenceEquals(old, img) AndAlso Not PlaceholderPool.Contains(old) Then
            old.Dispose()
        End If
    End Sub
#End Region

#Region "Data Loading and UI Population"
    Private Async Sub ViewRep_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Dim Uipanels As New List(Of Panel) From {
            Panel10, Panel12, Panel11
        }
        For Each pnl As Panel In Uipanels
            UiTheme.Round(pnl, 20)
        Next
        Me.FormBorderStyle = FormBorderStyle.None
        Me.StartPosition = FormStartPosition.CenterScreen

        Try
            Await System.Threading.Tasks.Task.Yield()
            loadedReport = IncidentStore.GetById(reportId)
            If loadedReport IsNot Nothing Then
                If loadedReport.attachments Is Nothing Then loadedReport.attachments = New List(Of String)

                ' Populate UI
                Label5.Text = If(loadedReport.description, "No description provided")
                Label10.Text = If(loadedReport.IncidentType, "Not specified")
                Label11.Text = "Not specified"
                If Not String.IsNullOrWhiteSpace(loadedReport.incidentDate) Then
                    Dim incidentDate As DateTime
                    If DateTime.TryParse(loadedReport.incidentDate, incidentDate) Then
                        Label11.Text = incidentDate.ToString("MM/dd/yyyy")
                    Else
                        Label11.Text = loadedReport.incidentDate
                    End If
                End If
                Label12.Text = "Not specified"
                If Not String.IsNullOrWhiteSpace(loadedReport.timestamp) Then
                    Dim timestamp As DateTime
                    If DateTime.TryParse(loadedReport.timestamp, timestamp) Then
                        Label12.Text = timestamp.ToString("MM/dd/yyyy HH:mm:ss")
                    Else
                        Label12.Text = loadedReport.timestamp
                    End If
                End If
                Label13.Text = If(loadedReport.location, "Not specified")
                Label14.Text = If(loadedReport.UrgencyLevel, "Not specified")
                LinkLabel1.Text = If(loadedReport.attachments IsNot Nothing AndAlso loadedReport.attachments.Count > 0,
                                 $"{loadedReport.attachments.Count} attachment(s) available", "No attachments")
                Label16.Text = If(loadedReport.contactInfo, "Not specified")
                If CurrentRole = "admin" Then
                    Label15.Text = If(loadedReport.Email, "Not specified")
                    Label15.Visible = True
                    Label6.Visible = True
                    Panel13.Visible = True
                Else
                    Label15.Visible = False
                    Label6.Visible = False
                    Panel13.Visible = False
                End If

                ' Load first attachment if available
                If loadedReport.attachments IsNot Nothing AndAlso loadedReport.attachments.Count > 0 Then
                    LoadCurrentImage()
                    UpdateNavigationButtons()
                Else
                    DisplayNoImage()
                End If

                ' First view moves the report from unseen to on-process and records the acknowledgement message.
                If loadedReport.status IsNot Nothing AndAlso loadedReport.status.ToLower() = "unseen" Then
                    loadedReport.status = "on-process"
                    Dim message As String = New MessageHelper().GenerateNotificationMessage(loadedReport.IncidentType, "on-process")
                    loadedReport.Message = message
                    IncidentStore.SetStatusAndMessage(reportId, "on-process", message)
                    AppLogger.WriteLog($"Report {reportId} status updated to on-process, acknowledgement message recorded")
                End If

                If Not String.IsNullOrWhiteSpace(loadedReport.Message) Then
                    TextBox1.Text = loadedReport.Message
                    TextBox1.Visible = True
                End If

                ' Show/hide send message button based on status
                UpdateSendMessageButtonVisibility(loadedReport.status)
            Else
                MessageBox.Show("Report not found.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading report: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Loading Error", MessageBoxButtons.OK)
        End Try


    End Sub

    Private Sub UpdateSendMessageButtonVisibility(status As String)
        ' Show send message button only if status is "on-process"
        If status?.ToLower() = "on-process" Then
            Button4.Visible = True
            Button4.Enabled = True
        Else
            Button4.Visible = False
            Button4.Enabled = False
        End If
    End Sub

    Private Sub LoadCurrentImage()
        Try
            Dim key = loadedReport.attachments(currentImageIndex)
            SetPreviewImage(ResolveAttachmentImage(key, currentImageIndex))
            PictureBox1.BackColor = System.Drawing.Color.White
            lblImageCounter.Text = $"Image {currentImageIndex + 1} of {loadedReport.attachments.Count}"
            lblImageCounter.Visible = True
        Catch ex As Exception
            DisplayImageError($"Failed to load image: {ex.Message}")
        End Try
    End Sub

    Private Sub DisplayNoImage()
        SetPreviewImage(Nothing)
        PictureBox1.BackColor = System.Drawing.Color.LightGray

        ' Create a "no image" text
        Using bmp As New System.Drawing.Bitmap(PictureBox1.Width, PictureBox1.Height)
            Using g As System.Drawing.Graphics = System.Drawing.Graphics.FromImage(bmp)
                g.Clear(System.Drawing.Color.LightGray)
                Using font As New System.Drawing.Font("Arial", 12, System.Drawing.FontStyle.Bold)
                    Using brush As New System.Drawing.SolidBrush(System.Drawing.Color.DarkGray)
                        Dim text = "No Attachments"
                        Dim textSize = g.MeasureString(text, font)
                        Dim x = (bmp.Width - textSize.Width) / 2
                        Dim y = (bmp.Height - textSize.Height) / 2
                        g.DrawString(text, font, brush, x, y)
                    End Using
                End Using
            End Using
            SetPreviewImage(New System.Drawing.Bitmap(bmp))
        End Using

        lblImageCounter.Visible = False
        btnPrevImage.Visible = False
        btnNextImage.Visible = False
    End Sub

    Private Sub DisplayImageError(message As String)
        SetPreviewImage(Nothing)
        PictureBox1.BackColor = System.Drawing.Color.LightSalmon

        ' Create error image
        Using bmp As New System.Drawing.Bitmap(PictureBox1.Width, PictureBox1.Height)
            Using g As System.Drawing.Graphics = System.Drawing.Graphics.FromImage(bmp)
                g.Clear(System.Drawing.Color.LightSalmon)
                Using font As New System.Drawing.Font("Arial", 10, System.Drawing.FontStyle.Regular)
                    Using brush As New System.Drawing.SolidBrush(System.Drawing.Color.DarkRed)
                        Dim text = "Failed to load image"
                        Dim textSize = g.MeasureString(text, font)
                        Dim x = (bmp.Width - textSize.Width) / 2
                        Dim y = (bmp.Height - textSize.Height) / 2
                        g.DrawString(text, font, brush, x, y)
                    End Using
                End Using
            End Using
            SetPreviewImage(New System.Drawing.Bitmap(bmp))
        End Using

        lblImageCounter.Text = $"Error: {message}"
    End Sub

    Private Sub btnPrevImage_Click(sender As Object, e As EventArgs) Handles btnPrevImage.Click
        If currentImageIndex > 0 Then
            currentImageIndex -= 1
            LoadCurrentImage()
            UpdateNavigationButtons()
        End If
    End Sub

    Private Sub btnNextImage_Click(sender As Object, e As EventArgs) Handles btnNextImage.Click
        If currentImageIndex < loadedReport.attachments.Count - 1 Then
            currentImageIndex += 1
            LoadCurrentImage()
            UpdateNavigationButtons()
        End If
    End Sub

    Private Sub UpdateNavigationButtons()
        If loadedReport?.attachments Is Nothing OrElse loadedReport.attachments.Count = 0 Then
            btnPrevImage.Visible = False
            btnNextImage.Visible = False
            lblImageCounter.Visible = False
            Return
        End If

        ' Show navigation if there's more than one image
        Dim hasMultipleImages = loadedReport.attachments.Count > 1
        btnPrevImage.Visible = hasMultipleImages
        btnNextImage.Visible = hasMultipleImages
        lblImageCounter.Visible = hasMultipleImages

        If hasMultipleImages Then
            btnPrevImage.Enabled = (currentImageIndex > 0)
            btnNextImage.Enabled = (currentImageIndex < loadedReport.attachments.Count - 1)
            lblImageCounter.Text = $"Image {currentImageIndex + 1} of {loadedReport.attachments.Count}"
        End If
    End Sub

#End Region

#Region "Back, Delete, and Export Logic"
    Private Async Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        Dim mainForm = CType(System.Windows.Forms.Application.OpenForms("Form1"), Form1)
        If mainForm IsNot Nothing Then
            Dim repUC = mainForm.Panel7.Controls.OfType(Of Reports).FirstOrDefault
            If repUC IsNot Nothing Then
                Await repUC.LoadReports
            End If
        End If
        Close
    End Sub

    Private Async Sub Button2_Click(sender As Object, e As EventArgs) Handles Button2.Click
        Try
            If MessageBox.Show("Are you sure you want to delete this report?", "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Question) = DialogResult.Yes Then
                IncidentStore.SetMessage(reportId, MessageHelper.DeletedMessage(), isManual:=False)
                IncidentStore.Delete(reportId)
                MessageBox.Show("Report deleted successfully and notification recorded.", "Success",
                          MessageBoxButtons.OK, MessageBoxIcon.Information)
                Dim mainForm = CType(System.Windows.Forms.Application.OpenForms("Form1"), Form1)
                If mainForm IsNot Nothing Then
                    Dim repUC As Reports = mainForm.Panel7.Controls.OfType(Of Reports).FirstOrDefault()
                    If repUC IsNot Nothing Then
                        Await repUC.LoadReports()
                    End If
                End If
                Me.Close()
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Error deleting report: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Delete Error", MessageBoxButtons.OK)
        End Try
    End Sub

    Private Async Sub Button3_Click(sender As Object, e As EventArgs) Handles Button3.Click
        If loadedReport Is Nothing Then
            MessageBox.Show("No report loaded.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return
        End If

        Dim templatesFile = IO.Path.Combine(System.Windows.Forms.Application.StartupPath, "templates.json")
        Dim templatesList As List(Of TemplateModel)

        ' Load templates
        If IO.File.Exists(templatesFile) Then
            Try
                Dim json = IO.File.ReadAllText(templatesFile)
                templatesList = System.Text.Json.JsonSerializer.Deserialize(Of List(Of TemplateModel))(json)
            Catch ex As Exception
                AppLogger.WriteLog($"Error loading templates: {ex.Message}")
                MessageBox.Show("Something went wrong. Please contact admin.", "Loading Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                Return
            End Try
        Else
            MessageBox.Show("No templates are available.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Return
        End If

        Using dlg As New SelectTemplateDialog(templatesList)
            If dlg.ShowDialog() = DialogResult.OK AndAlso dlg.SelectedTemplate IsNot Nothing Then
                Dim selectedTemplate = dlg.SelectedTemplate
                Dim templatePath As String = AppPaths.ResolveTemplatePath(selectedTemplate.Content)
                Dim exportDir As String = AppPaths.GeneratedReports

                ' Build export path
                Dim safeStudent As String = String.Concat(If(loadedReport.contactInfo, "").Where(Function(c) Char.IsLetterOrDigit(c) Or c = " ")).Trim()
                Dim timestamp As String = DateTime.Now.ToString("yyyyMMdd_HHmmss")
                Dim exportPath As String = IO.Path.Combine(exportDir, $"{selectedTemplate.Name}_{safeStudent}_{timestamp}.docx")

                ' Show progress if there are many images
                If loadedReport.attachments IsNot Nothing AndAlso loadedReport.attachments.Count > 3 Then
                    Using progressForm As New ExportProgressForm()
                        progressForm.Show()
                        System.Windows.Forms.Application.DoEvents()

                        Await ExportWithImagesAsync(templatePath, exportPath, progressForm)
                    End Using
                Else
                    Await ExportWithImagesAsync(templatePath, exportPath, Nothing)
                End If

                ' Mark the report resolved once documentation has been generated.
                Try
                    loadedReport.status = "resolved"
                    loadedReport.Message = MessageHelper.ResolvedMessage()
                    IncidentStore.SetStatusAndMessage(reportId, "resolved", MessageHelper.ResolvedMessage())
                    AppLogger.WriteLog($"Report {reportId} marked as resolved after export.")
                Catch ex As Exception
                    AppLogger.WriteLog($"Error updating status to resolved: {ex.Message}")
                    MessageBox.Show("Exported successfully but failed to update report status.", "Sync Warning",
            MessageBoxButtons.OK, MessageBoxIcon.Warning)
                End Try
            End If
        End Using
    End Sub

#End Region

#Region "Export Methods"
    Private Async Function ExportWithImagesAsync(templatePath As String, exportPath As String, progressForm As ExportProgressForm) As Task
        Try
            ' Use DocX instead of Word.Application
            Dim wordDoc As Xceed.Words.NET.DocX = Xceed.Words.NET.DocX.Load(templatePath)

            ' Replace text placeholders
            ReplacePlaceholders(wordDoc, loadedReport)

            ' Add images if any
            If loadedReport.attachments IsNot Nothing AndAlso loadedReport.attachments.Count > 0 Then
                Await AddImagesToDocumentAsync(wordDoc, progressForm)
            End If

            ' Save the document
            wordDoc.SaveAs(exportPath)

            If progressForm IsNot Nothing AndAlso progressForm.InvokeRequired Then
                progressForm.Invoke(Sub() progressForm.Close())
            End If

            ' Show success message
            Me.Invoke(Sub()
                          MessageBox.Show($"Report exported successfully to:{vbCrLf}{exportPath}", "Export Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
                      End Sub)

        Catch ex As Exception
            If progressForm IsNot Nothing AndAlso progressForm.InvokeRequired Then
                progressForm.Invoke(Sub() progressForm.Close())
            End If

            Me.Invoke(Sub()
                          AppLogger.WriteLog($"Error generating Word report: {ex.Message}")
                          MessageBox.Show("Something went wrong. Please contact admin.", "Export Error", MessageBoxButtons.OK)
                      End Sub)
        End Try
    End Function

    ' DocX 5.0.0's 2-arg ReplaceText resolves to a [Obsolete] overload; behaviour is fine for the demo.
#Disable Warning BC40000
    Private Sub ReplacePlaceholders(doc As Xceed.Words.NET.DocX, report As IncidentReport)
        doc.ReplaceText("{StudentName}", If(report.contactInfo, ""))
        doc.ReplaceText("{IncidentDate}", If(report.incidentDate, ""))
        doc.ReplaceText("{IncidentType}", If(report.IncidentType, ""))
        doc.ReplaceText("{Location}", If(report.location, ""))
        doc.ReplaceText("{UrgencyLevel}", If(report.UrgencyLevel, ""))
        doc.ReplaceText("{Description}", If(report.description, ""))
        doc.ReplaceText("{ContactInfo}", If(report.contactInfo, ""))
        doc.ReplaceText("{Status}", If(report.status, ""))
        doc.ReplaceText("{Timestamp}", If(report.timestamp, ""))

        ' Handle attachments list
        Dim attachmentsText As String = "No attachments"
        If report.attachments IsNot Nothing AndAlso report.attachments.Count > 0 Then
            attachmentsText = $"{report.attachments.Count} attachment(s) included"
        End If
        doc.ReplaceText("{Attachments}", attachmentsText)
    End Sub
#Enable Warning BC40000

    Private Async Function AddImagesToDocumentAsync(doc As Xceed.Words.NET.DocX, progressForm As ExportProgressForm) As Task
        Await System.Threading.Tasks.Task.Yield()
        Try
            ' Add attachments section header
            Dim attachmentsHeader = doc.InsertParagraph("Incident Attachments:")
            attachmentsHeader.Bold().FontSize(12).SpacingAfter(10)

            ' Add each image
            Dim total = loadedReport.attachments.Count
            For i As Integer = 0 To total - 1
                Dim idx = i
                If progressForm IsNot Nothing Then
                    progressForm.Invoke(Sub() progressForm.UpdateProgress(idx + 1, total, $"Adding attachment {idx + 1} of {total}"))
                End If

                AddImageToWordDoc(doc, loadedReport.attachments(idx), idx, idx + 1)
            Next

            If progressForm IsNot Nothing Then
                progressForm.Invoke(Sub() progressForm.UpdateProgress(loadedReport.attachments.Count,
                                                               loadedReport.attachments.Count, "Finalizing document..."))
            End If

        Catch ex As Exception
            Throw New Exception($"Error adding images to document: {ex.Message}")
        End Try
    End Function

    Private Sub AddImageToWordDoc(doc As Xceed.Words.NET.DocX, attachmentKey As String, index As Integer, imageNumber As Integer)
        Try
            Using ms As New IO.MemoryStream()
                ResolveAttachmentImage(attachmentKey, index).Save(ms, System.Drawing.Imaging.ImageFormat.Png)
                ms.Position = 0

                Dim caption = doc.InsertParagraph($"Attachment {imageNumber}:")
                caption.FontSize(11).Italic().SpacingAfter(5)

                Dim image = doc.AddImage(ms)
                Dim picture = image.CreatePicture(400, 300)

                Dim imageParagraph = doc.InsertParagraph()
                imageParagraph.AppendPicture(picture)
                imageParagraph.Alignment = Xceed.Document.NET.Alignment.center
                imageParagraph.SpacingAfter(15)
            End Using
        Catch ex As Exception
            doc.InsertParagraph($"Attachment {imageNumber}: [image unavailable]")
        End Try
    End Sub
#End Region

#Region "Window Drag & Border"
    Private Sub Viewrep_Shown(sender As Object, e As EventArgs) Handles Me.Shown
        Dim screenBounds As System.Drawing.Rectangle = System.Windows.Forms.Screen.PrimaryScreen.WorkingArea
        Me.Location = New System.Drawing.Point((screenBounds.Width - Me.Width) \ 2, (screenBounds.Height - Me.Height) \ 2)
    End Sub

    Private Sub PopupForm_MouseDown(sender As Object, e As MouseEventArgs) Handles Panel14.MouseDown
        drag = True
        mouseX = Cursor.Position.X - Me.Left
        mouseY = Cursor.Position.Y - Me.Top
    End Sub

    Private Sub PopupForm_MouseMove(sender As Object, e As MouseEventArgs) Handles Panel14.MouseMove
        If drag Then
            Me.Left = Cursor.Position.X - mouseX
            Me.Top = Cursor.Position.Y - mouseY
        End If
    End Sub

    Private Sub PopupForm_MouseUp(sender As Object, e As MouseEventArgs) Handles Panel14.MouseUp
        drag = False
    End Sub

    Protected Overrides Sub OnPaint(e As PaintEventArgs)
        MyBase.OnPaint(e)
        Using pen As New Pen(Color.Black, 1)
            e.Graphics.DrawRectangle(pen, 0, 0, Me.ClientSize.Width - 1, Me.ClientSize.Height - 1)
        End Using
    End Sub


    Private Sub Panel14_Paint(sender As Object, e As PaintEventArgs) Handles Panel14.Paint
        e.Graphics.SmoothingMode = Drawing2D.SmoothingMode.AntiAlias
        Dim rect As New System.Drawing.Rectangle(0, 0, Panel14.Width, Panel14.Height)
        Using brush As New Drawing2D.LinearGradientBrush(rect, UiTheme.Accent, UiTheme.PrimaryDark, Drawing2D.LinearGradientMode.Horizontal)
            e.Graphics.FillRectangle(brush, rect)
        End Using
    End Sub

    Private Sub Button4_Click(sender As Object, e As EventArgs) Handles Button4.Click
        Try
            Using msgDialog As New ManualMessageDialog()
                If msgDialog.ShowDialog() = DialogResult.OK Then
                    Dim customMessage As String = msgDialog.MessageText

                    If String.IsNullOrWhiteSpace(customMessage) Then
                        MessageBox.Show("Message cannot be empty.", "Validation Error",
                                      MessageBoxButtons.OK, MessageBoxIcon.Warning)
                        Return
                    End If

                    IncidentStore.SetMessage(reportId, customMessage, isManual:=True)
                    If loadedReport IsNot Nothing Then loadedReport.Message = customMessage
                    TextBox1.Text = customMessage
                    TextBox1.Visible = True

                    MessageBox.Show("Message recorded successfully!", "Success",
                                  MessageBoxButtons.OK, MessageBoxIcon.Information)
                End If
            End Using

        Catch ex As Exception
            AppLogger.WriteLog($"Error recording manual message: {ex.Message}")
            MessageBox.Show("Failed to record message. Please try again.", "Error",
                          MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub

#End Region

End Class