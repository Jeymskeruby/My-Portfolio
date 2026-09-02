Imports System.Threading.Tasks

Public Class Reports

#Region "Fields"
    Private reportsList As New List(Of IncidentReport)
    Private allReportsList As New List(Of IncidentReport)
#End Region

#Region "Form Load & Styling"
    Private Async Sub Reports_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.BackColor = UiTheme.AppBg
        UiTheme.CircleRegion(Panel10)
        UiTheme.CircleRegion(Panel6)
        UiTheme.CircleRegion(Panel7)
        UiTheme.CircleRegion(Panel11)
        TextBox1.BackColor = Panel1.BackColor
        TextBox1.PlaceholderText = "Search by Report ID..."

        Await Task.Delay(100)
        Dim Uipanels As New List(Of Panel) From {
            Panel9, Panel1, Panel2, Panel3, Panel4, Panel5
        }
        For Each pnl As Panel In Uipanels
            UiTheme.Round(pnl, 20)
        Next
        Await Task.WhenAll(LoadAllReportsForStatistics(), LoadReports())
        DataGridView1.ClearSelection()
    End Sub
#End Region

#Region "Data Loading"
    Private Async Function LoadAllReportsForStatistics() As Task
        Await Task.Yield()
        Try
            allReportsList = IncidentStore.GetAll()
            If Me.IsHandleCreated Then
                Invoke(Sub() UpdateStatistics(allReportsList))
            Else
                UpdateStatistics(allReportsList)
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading report statistics: {ex.Message}")
        End Try
    End Function

    Public Async Function LoadReports(Optional searchReportId As String = "") As Task
        Await Task.Yield()
        Try
            Dim all = IncidentStore.GetAll()

            If Not String.IsNullOrWhiteSpace(searchReportId) Then
                Dim q = searchReportId.ToLower()
                all = all.Where(Function(r) _
                    (r.ownerId IsNot Nothing AndAlso r.ownerId.ToLower().Contains(q)) _
                    OrElse (r.IncidentType IsNot Nothing AndAlso r.IncidentType.ToLower().Contains(q)) _
                    OrElse (r.timestamp IsNot Nothing AndAlso r.timestamp.ToLower().Contains(q)) _
                    OrElse (r.status IsNot Nothing AndAlso r.status.ToLower().Contains(q)) _
                    OrElse (r.contactInfo IsNot Nothing AndAlso r.contactInfo.ToLower().Contains(q))).ToList()
            End If

            reportsList = all

            Invoke(Sub()
                       DataGridView1.AutoGenerateColumns = False
                       DataGridView1.DataSource = SortReportsForDisplay(reportsList)
                       DataGridView1.ReadOnly = True
                       For Each row As DataGridViewRow In DataGridView1.Rows
                           If row.Cells("status").Value IsNot Nothing Then
                               Dim status = row.Cells("status").Value.ToString().ToLower()
                               If status = "unseen" Then
                                   row.DefaultCellStyle.BackColor = UiTheme.PrimarySoft
                                   row.DefaultCellStyle.ForeColor = UiTheme.PrimaryDark
                               ElseIf status = "on-process" Then
                                   row.DefaultCellStyle.BackColor = UiTheme.WarnSoft
                                   row.DefaultCellStyle.ForeColor = UiTheme.TextPrimary
                               ElseIf status = "resolved" Then
                                   row.DefaultCellStyle.BackColor = UiTheme.SuccessSoft
                                   row.DefaultCellStyle.ForeColor = UiTheme.Success
                               End If
                           End If
                       Next
                   End Sub)
        Catch ex As Exception
            Invoke(Sub()
                       AppLogger.WriteLog($"Error loading reports: {ex.Message}")
                       MessageBox.Show("Something went wrong. Please contact admin.", "Connection Error", MessageBoxButtons.OK)
                   End Sub)
        End Try
    End Function

    Private Function SortReportsForDisplay(reportList As List(Of IncidentReport)) As List(Of IncidentReport)
        Return reportList _
        .OrderByDescending(Function(r) r.status IsNot Nothing AndAlso r.status.ToLower() = "unseen") _
        .ThenByDescending(Function(r) r.status IsNot Nothing AndAlso r.status.ToLower() = "on-process") _
        .ThenByDescending(Function(r) r.status IsNot Nothing AndAlso r.status.ToLower() = "resolved") _
        .ThenBy(Function(r) r.timestamp) _
        .ToList()
    End Function
#End Region

#Region "Statistics Methods"
    Private Sub UpdateStatistics(reportsList As List(Of IncidentReport))
        If reportsList Is Nothing Then
            Label4.Text = "Loading..."
            Label5.Text = "Loading..."
            Label6.Text = "Loading..."
            Label9.Text = "Loading..."
            Return
        End If
        Dim totalReports = GetTotalReports(reportsList)
        Dim unseenReports = GetUnseenReports(reportsList)
        Dim resolvedReports = GetResolvedReports(reportsList)
        Dim onProcessReports = GetOnProcessReports(reportsList)
        Label4.Text = totalReports.ToString()
        Label5.Text = unseenReports.ToString()
        Label6.Text = resolvedReports.ToString()
        Label9.Text = onProcessReports.ToString()
    End Sub

    Private Function GetTotalReports(reportsList As List(Of IncidentReport)) As Integer
        Return reportsList.Count
    End Function

    Private Function GetUnseenReports(reportsList As List(Of IncidentReport)) As Integer
        Dim count As Integer = 0
        For Each report In reportsList
            If report.status IsNot Nothing AndAlso report.status.ToLower() = "unseen" Then
                count += 1
            End If
        Next
        Return count
    End Function

    Private Function GetOnProcessReports(reportsList As List(Of IncidentReport)) As Integer
        Dim count As Integer = 0
        For Each report In reportsList
            If report.status IsNot Nothing AndAlso report.status.ToLower() = "on-process" Then
                count += 1
            End If
        Next
        Return count
    End Function

    Private Function GetResolvedReports(reportsList As List(Of IncidentReport)) As Integer
        Dim count As Integer = 0
        For Each report In reportsList
            If report.status IsNot Nothing AndAlso report.status.ToLower() = "resolved" Then
                count += 1
            End If
        Next
        Return count
    End Function
#End Region

#Region "Search & Input Events"
    Private Async Sub TextBox1_TextChanged(sender As Object, e As EventArgs) Handles TextBox1.TextChanged
        If Not String.IsNullOrWhiteSpace(TextBox1.Text) Then
            Await LoadReports(TextBox1.Text.Trim())
        Else
            Await LoadReports()
        End If
    End Sub

    Private Async Sub TextBox1_KeyDown(sender As Object, e As KeyEventArgs) Handles TextBox1.KeyDown
        If e.KeyCode = Keys.Enter Then
            Await LoadReports(TextBox1.Text.Trim())
            e.Handled = True
            e.SuppressKeyPress = True
        End If
    End Sub
#End Region

#Region "Grid Icons & Actions"
    Private Sub DataGridView1_CellPainting(sender As Object, e As DataGridViewCellPaintingEventArgs) Handles DataGridView1.CellPainting
        If DataGridView1.Columns(e.ColumnIndex).Name = "ActionsR" AndAlso e.RowIndex >= 0 Then
            e.Handled = True
            e.PaintBackground(e.CellBounds, True)

            Dim iconSize As Integer = 20
            Dim padding As Integer = 10

            Dim viewIcon = My.Resources.eye_solid   ' Replace with your "view" icon name
            Dim trashIcon = My.Resources.trash_solid  ' Delete icon

            ' Calculate x positions for all three icons
            Dim xView = e.CellBounds.X + padding
            Dim yIcon = e.CellBounds.Y + (e.CellBounds.Height - iconSize) \ 2
            Dim xDelete = xView + iconSize + padding

            ' Draw all icons
            e.Graphics.DrawImage(viewIcon, New Rectangle(xView, yIcon, iconSize, iconSize))
            e.Graphics.DrawImage(trashIcon, New Rectangle(xDelete, yIcon, iconSize, iconSize))

            e.Paint(e.CellBounds, DataGridViewPaintParts.Border)
        End If
    End Sub


    Private Async Sub DataGridView1_CellMouseClick(sender As Object, e As DataGridViewCellMouseEventArgs) Handles DataGridView1.CellMouseClick
        If DataGridView1.Columns(e.ColumnIndex).Name = "ActionsR" AndAlso e.RowIndex >= 0 Then
            Dim iconSize As Integer = 20
            Dim padding As Integer = 10
            Dim mouseX As Integer = e.X

            ' Calculate left/right range for each icon within the cell
            Dim viewLeft = padding
            Dim viewRight = viewLeft + iconSize

            Dim deleteLeft = viewRight + padding
            Dim deleteRight = deleteLeft + iconSize

            If mouseX >= viewLeft AndAlso mouseX < viewRight Then
                If DataGridView1.Rows.Count = 0 OrElse
           (DataGridView1.Rows.Count = 1 AndAlso DataGridView1.Columns.Count = 1 AndAlso DataGridView1.Columns(0).HeaderText = "Message") Then

                    MessageBox.Show("No reports available or connection issue.", "No Data", MessageBoxButtons.OK, MessageBoxIcon.Warning)
                    Return
                End If

                If DataGridView1.SelectedRows.Count > 0 Then
                    Try
                        Dim reportId = DataGridView1.SelectedRows(0).Cells("ownerId").Value.ToString()
                        Dim selectedReport = reportsList.FirstOrDefault(Function(r) r.ownerId = reportId)
                        If selectedReport IsNot Nothing Then
                            Dim detailsForm As New ViewRep(selectedReport.ownerId)
                            detailsForm.CurrentRole = LoginForm.CurrentRole  ' Pass the user role explicitly
                            detailsForm.ShowDialog(Me)
                            Await Task.WhenAll(LoadAllReportsForStatistics(), LoadReports(TextBox1.Text.Trim()))
                        Else
                            MessageBox.Show("Report not found in local data.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                        End If
                    Catch ex As Exception
                        MessageBox.Show("Error viewing report: " & ex.Message, "View Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End Try
                Else
                    MessageBox.Show("Select a report to view.")
                End If
            ElseIf mouseX >= deleteLeft AndAlso mouseX < deleteRight Then
                If DataGridView1.Rows.Count = 0 OrElse
           DataGridView1.Rows.Count = 1 AndAlso DataGridView1.Columns.Count = 1 AndAlso DataGridView1.Columns(0).HeaderText = "Message" Then

                    MessageBox.Show("No reports available or connection issue.", "No Data", MessageBoxButtons.OK, MessageBoxIcon.Warning)
                    Return
                End If

                If DataGridView1.SelectedRows.Count > 0 Then
                    If MessageBox.Show("Are you sure you want to delete this report?", "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Question) = DialogResult.Yes Then
                        Try
                            Dim reportId = DataGridView1.SelectedRows(0).Cells("ownerId").Value.ToString

                            IncidentStore.SetMessage(reportId, MessageHelper.DeletedMessage(), isManual:=False)
                            IncidentStore.Delete(reportId)
                            Await Task.WhenAll(LoadAllReportsForStatistics, LoadReports(TextBox1.Text.Trim))
                        Catch ex As Exception
                            AppLogger.WriteLog($"Error deleting report: {ex.Message}")
                            MessageBox.Show("Something went wrong. Please contact admin.", "Delete Error", MessageBoxButtons.OK)
                        End Try
                    End If
                Else
                    MessageBox.Show("Select a report to delete.")
                End If
            End If
        End If
    End Sub

#End Region

End Class
