Imports System.Threading.Tasks
Imports System.Windows.Forms.DataVisualization.Charting
Imports Microsoft.Data.Sqlite

Public Class Dashboard
#Region "Private Fields"
    Private chartCases As Chart
    Private allRecords As New List(Of GraphRecord)
    Private dbFilePath As String = "student_records.db"
    Private conn As SqliteConnection

    Public Class GraphRecord
        Public Property RecordDate As DateTime
        Public Property Students As Integer
        Public Property Cases As Integer
        Public Property Reports As Integer
        Public Property Resolved As Integer
    End Class
#End Region

#Region "Database Initialization"
    Private Sub InitializeDatabase()
        conn = New SqliteConnection("Data Source=" & dbFilePath)
        conn.Open()
        DemoSeeder.EnsureSchema(conn)
    End Sub
#End Region

#Region "Form Load and Basic Setup"
    Private Async Sub Dashboard_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.BackColor = UiTheme.AppBg
        chartCases = New Chart()
        chartCases.Dock = DockStyle.Fill
        chartCases.BackColor = UiTheme.Surface
        chartCases.BorderlineColor = Color.Transparent
        chartCases.Palette = ChartColorPalette.None
        Dim area As New ChartArea("MainArea")
        area.BackColor = UiTheme.Surface
        area.AxisX.LineColor = UiTheme.BorderClr
        area.AxisY.LineColor = UiTheme.BorderClr
        area.AxisX.MajorGrid.Enabled = False
        area.AxisY.MajorGrid.LineColor = UiTheme.BorderClr
        area.AxisY.MajorGrid.LineDashStyle = ChartDashStyle.Dot
        area.AxisX.LabelStyle.Font = New Font("Segoe UI", 8.5F)
        area.AxisY.LabelStyle.Font = New Font("Segoe UI", 8.5F)
        area.AxisX.LabelStyle.ForeColor = UiTheme.TextSecondary
        area.AxisY.LabelStyle.ForeColor = UiTheme.TextSecondary
        chartCases.ChartAreas.Add(area)
        Dim legendStats As New Legend("StatsLegend")
        legendStats.Docking = Docking.Bottom
        legendStats.Font = New Font("Segoe UI", 9.5F, FontStyle.Regular)
        legendStats.ForeColor = UiTheme.TextPrimary
        chartCases.Legends.Add(legendStats)
        Panel8.Controls.Add(chartCases)

        UiTheme.CircleRegion(Panel10)
        UiTheme.CircleRegion(Panel13)
        UiTheme.CircleRegion(Panel14)
        UiTheme.CircleRegion(Panel15)
        UiTheme.CircleRegion(Panel16)
        DataGridView1.ClearSelection()

        InitializeDatabase()

        ComboBox1.Items.Clear()
        ComboBox1.Items.AddRange(New String() {"Annually", "Yearly", "Monthly"})
        ComboBox1.SelectedIndex = 0

        AddHandler ComboBox1.SelectedIndexChanged, AddressOf ComboBox1_SelectedIndexChanged
        AddHandler ComboBox2.SelectedIndexChanged, AddressOf ComboBox2_SelectedIndexChanged
        AddHandler ComboBox3.SelectedIndexChanged, AddressOf ComboBox3_SelectedIndexChanged

        Await LoadRealData()
        PopulateYearCombo()
        PopulateMonthCombo()
        ShowAnnuallyView()

        LoadAllStudents()
        LoadStudentsAtRisk()

        Await Task.Delay(100)
        Dim Uipanels As New List(Of Panel) From {
            Panel1, Panel2, Panel3, Panel4, Panel5, Panel6, Panel7
        }
        For Each pnl As Panel In Uipanels
            UiTheme.Round(pnl, 20)
        Next

    End Sub
#End Region

#Region "Data Loading and Processing"
    Private Async Function LoadRealData() As Task
        Await Task.Yield()
        allRecords.Clear()
        Dim localCases = GetCasesFromLocalDB()
        Dim incidentReports = GetReportsFromLocalDB()
        Dim combinedData = CombineData(localCases, incidentReports)
        allRecords.AddRange(combinedData)
        UpdateStatisticsLabels(localCases, incidentReports)
    End Function

    Private Function GetCasesFromLocalDB() As List(Of CaseData)
        Dim cases = New List(Of CaseData)()
        Try
            Dim totalCasesQuery = "SELECT COUNT(*) FROM CaseRecords"
            Using cmd As New SqliteCommand(totalCasesQuery, conn)
                Dim totalCases = Convert.ToInt32(cmd.ExecuteScalar())
            End Using
            Dim resolvedCasesQuery = "SELECT COUNT(*) FROM CaseRecords WHERE Finalized = 1"
            Using cmd As New SqliteCommand(resolvedCasesQuery, conn)
                Dim resolvedCases = Convert.ToInt32(cmd.ExecuteScalar())
            End Using
            Dim casesByDateQuery = "SELECT Date, COUNT(*) as CaseCount FROM CaseRecords GROUP BY Date"
            Using cmd As New SqliteCommand(casesByDateQuery, conn)
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        cases.Add(New CaseData With {
                            .CaseDate = DateTime.Parse(reader("Date").ToString()),
                            .CaseCount = Convert.ToInt32(reader("CaseCount")),
                            .ResolvedCount = 0
                        })
                    End While
                End Using
            End Using
            Dim resolvedByDateQuery = "SELECT Date, COUNT(*) as ResolvedCount FROM CaseRecords WHERE Finalized = 1 GROUP BY Date"
            Using cmd As New SqliteCommand(resolvedByDateQuery, conn)
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim caseDate = DateTime.Parse(reader("Date").ToString())
                        Dim resolvedCount = Convert.ToInt32(reader("ResolvedCount"))
                        Dim existingCase = cases.FirstOrDefault(Function(c) c.CaseDate.Date = caseDate.Date)
                        If existingCase IsNot Nothing Then
                            existingCase.ResolvedCount = resolvedCount
                        Else
                            cases.Add(New CaseData With {
                                .CaseDate = caseDate,
                                .CaseCount = 0,
                                .ResolvedCount = resolvedCount
                            })
                        End If
                    End While
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog("Error loading cases from local DB: " & ex.Message)
            MessageBox.Show("Something went wrong. Please contact admin.", "Fetching Error", MessageBoxButtons.OK)
        End Try
        Return cases
    End Function

    Private Function GetReportsFromLocalDB() As List(Of ReportData)
        Dim reports = New List(Of ReportData)()
        Try
            Using cmd As New SqliteCommand("SELECT timestamp, incidentDate, status FROM Incidents WHERE IFNULL(isDeleted,0) = 0", conn)
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim d As DateTime
                        Dim tsText = If(reader.IsDBNull(0), "", reader.GetValue(0).ToString())
                        Dim idText = If(reader.IsDBNull(1), "", reader.GetValue(1).ToString())
                        If Not DateTime.TryParse(tsText, d) Then DateTime.TryParse(idText, d)
                        reports.Add(New ReportData With {
                            .ReportDate = d,
                            .Status = If(reader.IsDBNull(2), "unseen", reader.GetValue(2).ToString())
                        })
                    End While
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog("Error loading incident reports: " & ex.Message)
        End Try
        Return reports
    End Function

    Private Function CombineData(localCases As List(Of CaseData), incidentReports As List(Of ReportData)) As List(Of GraphRecord)
        Dim combined = New List(Of GraphRecord)()
        Dim allDates = localCases.Select(Function(c) c.CaseDate.Date).Union(incidentReports.Select(Function(r) r.ReportDate.Date)).Distinct()
        For Each [date] In allDates
            Dim dayCases = localCases.Where(Function(c) c.CaseDate.Date = [date]).Sum(Function(c) c.CaseCount)
            Dim dayResolved = localCases.Where(Function(c) c.CaseDate.Date = [date]).Sum(Function(c) c.ResolvedCount)
            Dim dayReports = 0
            Dim dayUnreadReports = 0
            For Each report In incidentReports
                If report.ReportDate.Date = [date] Then
                    dayReports += 1
                    If report.Status = "unseen" Then
                        dayUnreadReports += 1
                    End If
                End If
            Next
            combined.Add(New GraphRecord With {
                .RecordDate = [date],
                .Cases = dayCases,
                .Resolved = dayResolved,
                .Reports = dayReports,
                .Students = GetStudentCountForDate([date])
            })
        Next
        Return combined.OrderBy(Function(r) r.RecordDate).ToList()
    End Function

    Private Function GetStudentCountForDate([date] As DateTime) As Integer
        Try
            Dim currentYear As Integer = DateTime.Now.Year
            Dim previousYear As Integer = currentYear - 1
            Dim currentYearQuery = "SELECT COUNT(DISTINCT LRN) FROM AcademicHistory WHERE SUBSTR(SchoolYear, 1, 4) = @CurrentYear"
            Using cmd As New SqliteCommand(currentYearQuery, conn)
                cmd.Parameters.AddWithValue("@CurrentYear", currentYear.ToString())
                Dim currentYearCount = Convert.ToInt32(cmd.ExecuteScalar())
                If currentYearCount > 0 Then
                    Return currentYearCount
                End If
            End Using
            Dim previousYearQuery = "SELECT COUNT(DISTINCT LRN) FROM AcademicHistory WHERE SUBSTR(SchoolYear, 1, 4) = @PreviousYear"
            Using cmd As New SqliteCommand(previousYearQuery, conn)
                cmd.Parameters.AddWithValue("@PreviousYear", previousYear.ToString())
                Dim previousYearCount = Convert.ToInt32(cmd.ExecuteScalar())
                If previousYearCount > 0 Then
                    Return previousYearCount
                End If
            End Using
            Dim latestYearQuery = "SELECT COUNT(DISTINCT LRN) FROM AcademicHistory WHERE SchoolYear = (SELECT MAX(SchoolYear) FROM AcademicHistory)"
            Using cmd As New SqliteCommand(latestYearQuery, conn)
                Dim latestYearCount = Convert.ToInt32(cmd.ExecuteScalar())
                Return latestYearCount
            End Using
        Catch ex As Exception
            AppLogger.WriteLog("Error getting student count: " & ex.Message)
            Return 0
        End Try
    End Function

    Private Sub UpdateStatisticsLabels(localCases As List(Of CaseData), incidentReports As List(Of ReportData))
        Dim totalCases = localCases.Sum(Function(c) c.CaseCount)
        Label6.Text = totalCases.ToString()
        Dim totalReports = incidentReports.Count
        Label7.Text = totalReports.ToString()
        Dim unreadReports As Integer = 0
        For Each report In incidentReports
            If report.Status = "unseen" Then
                unreadReports += 1
            End If
        Next
        Label8.Text = unreadReports.ToString()
        Dim resolvedCases = localCases.Sum(Function(c) c.ResolvedCount)
        Label9.Text = resolvedCases.ToString()
    End Sub
#End Region

#Region "Student Lists and Grids"
    Private Sub LoadAllStudents()
        Try
            Dim query = "SELECT s.LRN, s.FirstName, s.MiddleInitial, s.Surname, 
                                ah.Grade, ah.Section
                         FROM Students s
                         LEFT JOIN (
                             SELECT ah1.LRN, ah1.Grade, ah1.Section, ah1.SchoolYear
                             FROM AcademicHistory ah1
                             INNER JOIN (
                                 SELECT LRN, MAX(SchoolYear) as LatestYear
                                 FROM AcademicHistory
                                 GROUP BY LRN
                             ) ah2 ON ah1.LRN = ah2.LRN AND ah1.SchoolYear = ah2.LatestYear
                         ) ah ON s.LRN = ah.LRN
                         GROUP BY s.LRN
                         ORDER BY s.Surname, s.FirstName"
            Using cmd As New SqliteCommand(query, conn)
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim lrn = reader("LRN").ToString()
                        Dim name = $"{reader("Surname")}, {reader("FirstName")} {If(Not String.IsNullOrEmpty(reader("MiddleInitial").ToString()), reader("MiddleInitial").ToString(), "")}".Trim()
                        Dim grade = If(IsDBNull(reader("Grade")) OrElse String.IsNullOrEmpty(reader("Grade").ToString()), "N/A", reader("Grade").ToString())
                        Dim section = If(IsDBNull(reader("Section")) OrElse String.IsNullOrEmpty(reader("Section").ToString()), "N/A", reader("Section").ToString())
                        DataGridView1.Rows.Add(lrn, name, grade, section)
                    End While
                End Using
            End Using
            DataGridView1.ReadOnly = True
            DataGridView1.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading students: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error", MessageBoxButtons.OK)
        End Try
        DataGridView1.ClearSelection()
    End Sub

    Private Sub LoadStudentsAtRisk()
        Try
            Dim query = "SELECT s.LRN, s.FirstName, s.MiddleInitial, s.Surname, 
                                ah.Grade, 
                                COUNT(cr.CaseID) as CaseCount
                         FROM Students s
                         LEFT JOIN (
                             SELECT ah1.LRN, ah1.Grade
                             FROM AcademicHistory ah1
                             INNER JOIN (
                                 SELECT LRN, MAX(SchoolYear) as LatestYear
                                 FROM AcademicHistory
                                 GROUP BY LRN
                             ) ah2 ON ah1.LRN = ah2.LRN AND ah1.SchoolYear = ah2.LatestYear
                         ) ah ON s.LRN = ah.LRN
                         LEFT JOIN CaseRecords cr ON s.LRN = cr.LRN
                         GROUP BY s.LRN, s.FirstName, s.MiddleInitial, s.Surname, ah.Grade
                         HAVING COUNT(cr.CaseID) > 0
                         ORDER BY CaseCount DESC
                         LIMIT 10"
            Using cmd As New SqliteCommand(query, conn)
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim name = $"{reader("Surname")}, {reader("FirstName")} {If(Not String.IsNullOrEmpty(reader("MiddleInitial").ToString()), reader("MiddleInitial").ToString(), "")}".Trim()
                        Dim grade = If(IsDBNull(reader("Grade")) OrElse String.IsNullOrEmpty(reader("Grade").ToString()), "N/A", reader("Grade").ToString())
                        Dim caseCount = Convert.ToInt32(reader("CaseCount"))
                        DataGridView2.Rows.Add(name, grade, caseCount)
                    End While
                End Using
            End Using
            DataGridView2.ReadOnly = True
            For Each row As DataGridViewRow In DataGridView2.Rows
                If row.Cells("CaseCount").Value IsNot Nothing Then
                    Dim caseCount = Convert.ToInt32(row.Cells("CaseCount").Value)
                    Select Case caseCount
                        Case >= 5
                            row.DefaultCellStyle.BackColor = UiTheme.PrimarySoft
                            row.DefaultCellStyle.ForeColor = UiTheme.PrimaryDark
                        Case 3 To 4
                            row.DefaultCellStyle.BackColor = UiTheme.WarnSoft
                        Case 1 To 2
                            row.DefaultCellStyle.BackColor = UiTheme.SuccessSoft
                    End Select
                End If
            Next
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading students at risk: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error", MessageBoxButtons.OK)
        End Try
        DataGridView2.ClearSelection()
    End Sub
#End Region

#Region "Label and ComboBox Helpers"

    Private Sub PopulateYearCombo()
        ComboBox2.Items.Clear()
        If allRecords.Count = 0 Then Exit Sub
        Dim years = allRecords.Select(Function(r) r.RecordDate.Year).Distinct().OrderBy(Function(y) y)
        For Each y In years
            ComboBox2.Items.Add(y.ToString())
        Next
        If ComboBox2.Items.Count > 0 Then ComboBox2.SelectedIndex = ComboBox2.Items.Count - 1
    End Sub

    Private Sub PopulateMonthCombo()
        ComboBox3.Items.Clear()
        If ComboBox2.SelectedItem Is Nothing Then Exit Sub
        Dim selectedYear = Integer.Parse(ComboBox2.SelectedItem.ToString())
        Dim months = allRecords.Where(Function(r) r.RecordDate.Year = selectedYear).Select(Function(r) r.RecordDate.Month).Distinct().OrderBy(Function(m) m)
        For Each m In months
            ComboBox3.Items.Add(m.ToString("D2"))
        Next
        If ComboBox3.Items.Count > 0 Then ComboBox3.SelectedIndex = ComboBox3.Items.Count - 1
    End Sub
#End Region

#Region "ComboBox and Chart Event Handlers"
    Private Sub ComboBox1_SelectedIndexChanged(sender As Object, e As EventArgs)
        Dim mode = ComboBox1.SelectedItem.ToString
        Select Case mode
            Case "Annually"
                ShowAnnuallyView()
            Case "Yearly"
                ShowYearlyView()
            Case "Monthly"
                ShowMonthlyView()
        End Select
        ComboBox2.Enabled = (mode <> "Annually")
        ComboBox3.Enabled = (mode = "Monthly")
    End Sub

    Private Sub ComboBox2_SelectedIndexChanged(sender As Object, e As EventArgs)
        PopulateMonthCombo()
        If ComboBox1.SelectedItem.ToString = "Yearly" Then
            ShowYearlyView()
        ElseIf ComboBox1.SelectedItem.ToString = "Monthly" Then
            ShowMonthlyView()
        End If
    End Sub

    Private Sub ComboBox3_SelectedIndexChanged(sender As Object, e As EventArgs)
        If ComboBox1.SelectedItem.ToString = "Monthly" Then
            ShowMonthlyView()
        End If
    End Sub
#End Region

#Region "Chart Rendering"
    Private Sub ShowAnnuallyView()
        If chartCases Is Nothing OrElse allRecords.Count = 0 Then Exit Sub
        chartCases.Series.Clear()
        chartCases.Titles.Clear()
        chartCases.Titles.Add("Annual Comparison")
        Dim byYear = allRecords.
            GroupBy(Function(r) r.RecordDate.Year).
            OrderBy(Function(g) g.Key).
            Select(Function(g) New With {
                .Year = g.Key,
                .Cases = g.Sum(Function(r) r.Cases),
                .Reports = g.Sum(Function(r) r.Reports),
                .Resolved = g.Sum(Function(r) r.Resolved)
            })
        If byYear.Any() Then
            AddStatSeries("Cases", UiTheme.ChartCases, byYear.Select(Function(x) x.Year.ToString()), byYear.Select(Function(x) x.Cases))
            AddStatSeries("Reports", UiTheme.ChartReports, byYear.Select(Function(x) x.Year.ToString()), byYear.Select(Function(x) x.Reports))
            AddStatSeries("Resolved Cases", UiTheme.ChartResolved, byYear.Select(Function(x) x.Year.ToString()), byYear.Select(Function(x) x.Resolved))
        End If
    End Sub

    Private Sub ShowYearlyView()
        If chartCases Is Nothing OrElse ComboBox2.SelectedItem Is Nothing OrElse allRecords.Count = 0 Then Exit Sub
        chartCases.Series.Clear()
        chartCases.Titles.Clear()
        Dim selectedYear = Integer.Parse(ComboBox2.SelectedItem.ToString())
        chartCases.Titles.Add("Yearly Summary (" & selectedYear & ")")
        Dim byMonth = allRecords.Where(Function(r) r.RecordDate.Year = selectedYear).
            GroupBy(Function(r) r.RecordDate.Month).
            OrderBy(Function(g) g.Key).
            Select(Function(g) New With {
                .Month = g.Key,
                .Cases = g.Sum(Function(r) r.Cases),
                .Reports = g.Sum(Function(r) r.Reports),
                .Resolved = g.Sum(Function(r) r.Resolved)
            })
        If byMonth.Any() Then
            AddStatSeries("Cases", UiTheme.ChartCases, byMonth.Select(Function(x) MonthName(x.Month)), byMonth.Select(Function(x) x.Cases))
            AddStatSeries("Reports", UiTheme.ChartReports, byMonth.Select(Function(x) MonthName(x.Month)), byMonth.Select(Function(x) x.Reports))
            AddStatSeries("Resolved", UiTheme.ChartResolved, byMonth.Select(Function(x) MonthName(x.Month)), byMonth.Select(Function(x) x.Resolved))
        End If
    End Sub

    Private Sub ShowMonthlyView()
        If chartCases Is Nothing OrElse ComboBox2.SelectedItem Is Nothing OrElse ComboBox3.SelectedItem Is Nothing OrElse allRecords.Count = 0 Then Exit Sub
        chartCases.Series.Clear()
        chartCases.Titles.Clear()
        Dim selectedYear = Integer.Parse(ComboBox2.SelectedItem.ToString())
        Dim selectedMonth = Integer.Parse(ComboBox3.SelectedItem.ToString())
        chartCases.Titles.Add("Monthly Summary (" & MonthName(selectedMonth) & " " & selectedYear & ")")
        Dim byDay = allRecords.Where(Function(r) r.RecordDate.Year = selectedYear And r.RecordDate.Month = selectedMonth).
            GroupBy(Function(r) r.RecordDate.Day).
            OrderBy(Function(g) g.Key).
            Select(Function(g) New With {
                .Day = g.Key,
                .Cases = g.Sum(Function(r) r.Cases),
                .Reports = g.Sum(Function(r) r.Reports),
                .Resolved = g.Sum(Function(r) r.Resolved)
            })
        If byDay.Any() Then
            AddStatSeries("Cases", UiTheme.ChartCases, byDay.Select(Function(x) x.Day.ToString()), byDay.Select(Function(x) x.Cases))
            AddStatSeries("Reports", UiTheme.ChartReports, byDay.Select(Function(x) x.Day.ToString()), byDay.Select(Function(x) x.Reports))
            AddStatSeries("Resolved", UiTheme.ChartResolved, byDay.Select(Function(x) x.Day.ToString()), byDay.Select(Function(x) x.Resolved))
        End If
    End Sub

    Private Sub AddStatSeries(seriesName As String, lineColor As Color, xVals As IEnumerable(Of String), yVals As IEnumerable(Of Integer))
        Dim s As New Series(seriesName)
        s.ChartType = SeriesChartType.Column
        s.Color = lineColor
        s.Legend = "StatsLegend"
        s.BorderWidth = 0
        s("PointWidth") = "0.65"
        s("DrawingStyle") = "Cylinder"
        Dim i As Integer = 0
        For Each x In xVals
            s.Points.AddXY(x, yVals.ElementAt(i))
            i += 1
        Next
        chartCases.Series.Add(s)
    End Sub
#End Region

#Region "Internal Data Classes"
    Private Class CaseData
        Public Property CaseDate As DateTime
        Public Property CaseCount As Integer
        Public Property ResolvedCount As Integer
    End Class

    Private Class ReportData
        Public Property ReportDate As DateTime
        Public Property Status As String
    End Class
#End Region

#Region "Form Closing"
    Private Sub Dashboard_FormClosing(sender As Object, e As EventArgs) Handles MyBase.Disposed
        conn?.Close()
        conn?.Dispose()
    End Sub

#End Region

End Class
