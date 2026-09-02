Imports System.Text.Json
Imports System.IO

Public Class Templates

#Region "Fields & Data Model"
    Private templatesFile As String = IO.Path.Combine(Application.StartupPath, "templates.json")
    Private templatesList As New List(Of TemplateModel)

    Public Class TemplateModel
        Public Property Id As Guid
        Public Property Name As String
        Public Property Content As String
    End Class
#End Region

#Region "Utilities"
    Private Function GetWinWordPath() As String
        Dim possiblePaths As String() = {
            "C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE",
            "C:\Program Files (x86)\Microsoft Office\root\Office16\WINWORD.EXE",
            "C:\Program Files\Microsoft Office\Office16\WINWORD.EXE",
            "C:\Program Files (x86)\Microsoft Office\Office16\WINWORD.EXE",
            "C:\Program Files\Microsoft Office\root\Office15\WINWORD.EXE",
            "C:\Program Files (x86)\Microsoft Office\root\Office15\WINWORD.EXE"
        }
        For Each path In possiblePaths
            If File.Exists(path) Then
                Return path
            End If
        Next
        Return ""
    End Function

    ' Helper method to create transparent icon buttons without background
    Private Function CreateIconButton(icon As Image, size As Integer, location As Point, tag As Object) As Button
        Dim btn As New Button With {
            .BackgroundImage = icon,
            .BackgroundImageLayout = ImageLayout.Zoom,
            .Width = size,
            .Height = size,
            .Location = location,
            .Tag = tag,
            .FlatStyle = FlatStyle.Flat,
            .BackColor = Color.Transparent,
            .ForeColor = Color.Transparent,
            .Text = ""
        }

        ' Remove all borders and background effects
        btn.FlatAppearance.BorderSize = 0
        btn.FlatAppearance.MouseOverBackColor = Color.Transparent
        btn.FlatAppearance.MouseDownBackColor = Color.Transparent

        Return btn
    End Function
#End Region

#Region "Form Load and Data"
    Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.BackColor = UiTheme.AppBg
        LoadTemplates()
        RenderTemplates()
    End Sub

    Private Sub LoadTemplates()
        If File.Exists(templatesFile) Then
            Try
                Dim json = File.ReadAllText(templatesFile)
                templatesList = JsonSerializer.Deserialize(Of List(Of TemplateModel))(json)
            Catch ex As Exception
                AppLogger.WriteLog("Failed to load templates: " & ex.Message)
                MessageBox.Show("Template file is corrupted. Loading empty list.")
                templatesList = New List(Of TemplateModel)
            End Try
        Else
            templatesList = New List(Of TemplateModel)
        End If
    End Sub

    Private Sub SaveTemplates()
        Dim json = JsonSerializer.Serialize(templatesList)
        File.WriteAllText(templatesFile, json)
    End Sub
#End Region

#Region "Grid and Render"
    Private Sub RenderTemplates()
        Dim CardWidth As Integer = 220
        Dim CardHeight As Integer = 180

        ' 1. Clear current cards
        FlowLayoutPanel1.Controls.Clear()

        ' 2. Add "Create New Template" card
        Dim cardCreate As New Panel With {
            .Width = CardWidth,
            .Height = CardHeight,
            .BackColor = Color.White,
            .Margin = New Padding(10),
            .BorderStyle = BorderStyle.None
        }
        UiTheme.Round(cardCreate, 20)

        ' Plus icon in circular button
        Dim btnCreate As New Button With {
            .Text = "+",
            .Font = New Font("Segoe UI", 24, FontStyle.Bold),
            .Width = 60,
            .Height = 60,
            .Location = New Point((CardWidth - 50) \ 2, 30),
            .FlatStyle = FlatStyle.Flat,
            .BackColor = Color.FromArgb(240, 240, 240),
            .ForeColor = Color.Gray
        }

        ' Make circular
        UiTheme.CircleRegion(btnCreate)
        btnCreate.FlatAppearance.BorderSize = 0
        btnCreate.FlatAppearance.MouseOverBackColor = Color.FromArgb(220, 220, 220)
        btnCreate.FlatAppearance.MouseDownBackColor = Color.FromArgb(200, 200, 200)

        AddHandler btnCreate.Click, AddressOf CreateCard_Click
        cardCreate.Controls.Add(btnCreate)

        ' Main label
        Dim lblTitle As New Label With {
            .Text = "Create New Template",
            .Font = New Font("Segoe UI", 11, FontStyle.Bold),
            .Width = CardWidth,
            .Height = 25,
            .TextAlign = ContentAlignment.MiddleCenter,
            .Location = New Point(0, 105)
        }
        cardCreate.Controls.Add(lblTitle)
        ' Subtitle
        Dim lblSubtitle As New Label With {
            .Text = "Click to start from scratch",
            .Font = New Font("Segoe UI", 9, FontStyle.Regular),
            .ForeColor = Color.Gray,
            .Width = CardWidth,
            .Height = 20,
            .TextAlign = ContentAlignment.MiddleCenter,
            .Location = New Point(0, 130)
        }
        cardCreate.Controls.Add(lblSubtitle)
        ' Click handlers
        AddHandler cardCreate.Click, AddressOf CreateCard_Click
        AddHandler lblTitle.Click, AddressOf CreateCard_Click
        AddHandler lblSubtitle.Click, AddressOf CreateCard_Click

        FlowLayoutPanel1.Controls.Add(cardCreate)

        ' 3. Add template cards
        For Each tmpl In templatesList
            Dim card As New Panel With {
                .Width = CardWidth,
                .Height = CardHeight,
                .BackColor = Color.White,
                .Margin = New Padding(10),
                .BorderStyle = BorderStyle.None
            }
            UiTheme.Round(card, 20)

            ' Template icon/thumbnail
            Dim docIcon As New Panel With {
                .Width = 40,
                .Height = 40,
                .BackColor = Color.FromArgb(230, 240, 255),
                .Location = New Point(15, 15)
            }
            UiTheme.Round(docIcon, 8)

            ' Document icon label
            Dim docLabel As New Label With {
                .Text = "📄",
                .Font = New Font("Segoe UI", 14),
                .TextAlign = ContentAlignment.MiddleCenter,
                .Dock = DockStyle.Fill
            }
            docIcon.Controls.Add(docLabel)
            card.Controls.Add(docIcon)

            ' Name label
            Dim lblName As New Label With {
                .Text = tmpl.Name,
                .Font = New Font("Segoe UI", 10, FontStyle.Bold),
                .Location = New Point(65, 20),
                .Width = CardWidth - 80
            }
            card.Controls.Add(lblName)

            ' Description label
            Dim lblDesc As New Label With {
                .Text = "Document template",
                .Font = New Font("Segoe UI", 8),
                .ForeColor = Color.Gray,
                .Location = New Point(65, 40),
                .Width = CardWidth - 80
            }
            card.Controls.Add(lblDesc)

            ' Last updated label
            Dim lastUpdated As String = ""
            Dim tmplPath As String = AppPaths.ResolveTemplatePath(tmpl.Content)
            If File.Exists(tmplPath) Then
                lastUpdated = File.GetLastWriteTime(tmplPath).ToString("MMM dd, yyyy")
            End If
            Dim lblDate As New Label With {
                .Text = "Last updated: " & lastUpdated,
                .Font = New Font("Segoe UI", 8, FontStyle.Italic),
                .Location = New Point(15, CardHeight - 50),
                .ForeColor = Color.Gray,
                .Width = CardWidth - 30
            }
            card.Controls.Add(lblDate)

            ' Action buttons container
            Dim actionPanel As New Panel With {
                .Width = CardWidth - 100,
                .Height = 35,
                .Location = New Point(50, CardHeight - 85),
                .BackColor = Color.Transparent
            }

            ' Edit button (transparent icon) - using pen_solid image
            If My.Resources.pen_solid IsNot Nothing Then
                Dim btnEdit As Button = CreateIconButton(My.Resources.pen_solid, 25, New Point(0, 5), tmpl)
                AddHandler btnEdit.Click, AddressOf BtnEdit_Click
                actionPanel.Controls.Add(btnEdit)
            Else
                ' Fallback if image not found
                Dim btnEdit As New Button With {
                    .Text = "✏️",
                    .Width = 25,
                    .Height = 25,
                    .Location = New Point(0, 5),
                    .Tag = tmpl,
                    .FlatStyle = FlatStyle.Flat,
                    .BackColor = Color.Transparent
                }
                btnEdit.FlatAppearance.BorderSize = 0
                AddHandler btnEdit.Click, AddressOf BtnEdit_Click
                actionPanel.Controls.Add(btnEdit)
            End If

            ' Delete button (transparent icon) - using trash_solid image
            If My.Resources.trash_solid IsNot Nothing Then
                Dim btnDelete As Button = CreateIconButton(My.Resources.trash_solid, 25, New Point(actionPanel.Width - 25, 5), tmpl)
                AddHandler btnDelete.Click, AddressOf BtnDelete_Click
                actionPanel.Controls.Add(btnDelete)
            Else
                ' Fallback if image not found
                Dim btnDelete As New Button With {
                    .Text = "🗑️",
                    .Width = 25,
                    .Height = 25,
                    .Location = New Point(actionPanel.Width - 25, 5),
                    .Tag = tmpl,
                    .FlatStyle = FlatStyle.Flat,
                    .BackColor = Color.Transparent
                }
                btnDelete.FlatAppearance.BorderSize = 0
                AddHandler btnDelete.Click, AddressOf BtnDelete_Click
                actionPanel.Controls.Add(btnDelete)
            End If

            card.Controls.Add(actionPanel)

            FlowLayoutPanel1.Controls.Add(card)
        Next
    End Sub

#End Region

#Region "Create, Edit, Delete Logic"
    Private Sub CreateCard_Click(sender As Object, e As EventArgs)
        Dim saveDir = Path.Combine(Application.StartupPath, "Templates")
        If Not Directory.Exists(saveDir) Then Directory.CreateDirectory(saveDir)

        Dim name = InputBox("Enter a name for the new template:", "Create New Template").Trim()
        If name = "" Then
            MessageBox.Show("Template not saved. Please provide a valid name.")
            Return
        End If
        If templatesList.Any(Function(t) t.Name = name) Then
            MessageBox.Show("Template with that name already exists.")
            Return
        End If

        Dim safeName = String.Concat(name.Where(Function(c) Char.IsLetterOrDigit(c) Or c = " ")).Trim()
        Dim blankPath = Path.Combine(saveDir, safeName & ".docx")

        Try
            Using doc = Xceed.Words.NET.DocX.Create(blankPath)
                doc.InsertParagraph("Design your template here. Use {Placeholders} for merge fields.")
                doc.Save()
            End Using

            If Not File.Exists(blankPath) Then
                MessageBox.Show("Could not create the blank .docx at: " & blankPath)
                Return
            End If

            Dim wordPath As String = GetWinWordPath()
            If wordPath = "" Then
                MessageBox.Show("Microsoft Word not found. Please check installation!")
                File.Delete(blankPath)
                Return
            End If

            Dim wordProcess = Process.Start(wordPath, """" & blankPath & """")
            If wordProcess IsNot Nothing Then wordProcess.WaitForExit()

            Dim tmpl As New TemplateModel With {.Id = Guid.NewGuid(), .Name = name, .Content = blankPath}
            templatesList.Add(tmpl)
            SaveTemplates()
            RenderTemplates()

        Catch ex As Exception
            AppLogger.WriteLog($"could not create or open the template file. Error: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error", MessageBoxButtons.OK)
            If File.Exists(blankPath) Then
                Try
                    File.Delete(blankPath)
                Catch e2 As Exception
                End Try
            End If
            Return
        End Try
    End Sub

    Private Sub BtnEdit_Click(sender As Object, e As EventArgs)
        Dim btn = CType(sender, Button)
        Dim tmpl = CType(btn.Tag, TemplateModel)
        Dim tmplPath = AppPaths.ResolveTemplatePath(tmpl.Content)
        If File.Exists(tmplPath) Then
            LaunchWordOnFile(tmplPath)
        Else
            MessageBox.Show("Template file does not exist. Please re-import or recreate this template.")
        End If
    End Sub

    Private Sub BtnDelete_Click(sender As Object, e As EventArgs)
        Dim btn = CType(sender, Button)
        Dim tmpl = CType(btn.Tag, TemplateModel)
        If MessageBox.Show("Delete template '" & tmpl.Name & "' and its file?", "Confirm", MessageBoxButtons.YesNo) = DialogResult.Yes Then
            Dim tmplPath = AppPaths.ResolveTemplatePath(tmpl.Content)
            If Not String.IsNullOrWhiteSpace(tmplPath) AndAlso File.Exists(tmplPath) Then
                Try
                    File.Delete(tmplPath)
                Catch ex As Exception
                    AppLogger.WriteLog("Could not delete file: " & tmplPath & vbCrLf & "Error: " & ex.Message)
                    MessageBox.Show("Something went wrong. Please contact admin.", "Deleting Error", MessageBoxButtons.OK)
                End Try
            End If
            templatesList.Remove(tmpl)
            SaveTemplates()
            RenderTemplates()
        End If
    End Sub

    Private Sub LaunchWordOnFile(docxPath As String)
        Dim wordPath As String = GetWinWordPath()
        If wordPath = "" Then
            MessageBox.Show("Microsoft Word not found. Please check installation!")
            Return
        End If
        Try
            Process.Start(wordPath, """" & docxPath & """")
        Catch ex As Exception
            MessageBox.Show("Could not open Microsoft Word. Please ensure it is installed.")
        End Try
    End Sub
#End Region

#Region "Template Import"
    Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        Dim ofd As New OpenFileDialog With {
            .Filter = "Word Template (*.docx)|*.docx",
            .RestoreDirectory = True
        }
        If ofd.ShowDialog() = DialogResult.OK Then
            Dim saveDir = Path.Combine(Application.StartupPath, "Templates")
            If Not Directory.Exists(saveDir) Then Directory.CreateDirectory(saveDir)
            Dim uniqueName = Path.GetFileNameWithoutExtension(ofd.FileName) & "_" & Guid.NewGuid().ToString("N") & ".docx"
            Dim destPath = Path.Combine(saveDir, uniqueName)
            File.Copy(ofd.FileName, destPath)

            Dim templateName = InputBox("Enter a display name for this template:", "Template Name", Path.GetFileNameWithoutExtension(ofd.FileName)).Trim()
            If templateName = "" Then templateName = Path.GetFileNameWithoutExtension(ofd.FileName)

            templatesList.Add(New TemplateModel With {.Id = Guid.NewGuid(), .Name = templateName, .Content = destPath})
            SaveTemplates()
            RenderTemplates()
        End If
    End Sub
#End Region

End Class