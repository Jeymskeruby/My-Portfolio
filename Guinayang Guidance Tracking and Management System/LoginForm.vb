Imports System.Drawing.Drawing2D
Imports System.IO
Imports Microsoft.Data.Sqlite

Public Class LoginForm

#Region "Fields & Properties"
    Public Property CurrentRole As String
    Public ReadOnly dbPath As String = Path.Combine(Application.StartupPath, "users.db")
    Public ReadOnly dbConnStr As String = $"Data Source={dbPath}"

    ' Demo build: click-to-login controls (built at runtime, no Designer changes).
    Private btnAdmin As Button
    Private btnStaff As Button
    Private btnResetDemo As Button
#End Region

#Region "Form Events"
    Private Sub LoginForm_Shown(sender As Object, e As EventArgs) Handles Me.Shown
        If btnAdmin IsNot Nothing Then btnAdmin.Focus()
    End Sub

    Private Sub LoginForm_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        Me.FormBorderStyle = FormBorderStyle.None
        Me.BackColor = UiTheme.Surface
        Dim borderThickness As Integer = 4
        Panel3.Location = New Point(borderThickness, borderThickness)
        Panel3.Size = New Size(Me.ClientSize.Width - 2 * borderThickness, (Me.ClientSize.Height \ 4) - borderThickness)
        Panel3.BackColor = UiTheme.PrimaryDark
        UiTheme.CircleRegion(PictureBox3)
        UiTheme.CircleRegion(PictureBox4)

        EnsureDatabase()
        Try
            DemoSeeder.EnsureSeededOnce()
        Catch ex As Exception
            AppLogger.WriteLog($"Demo seed on startup failed: {ex.Message}")
        End Try

        UiTheme.Apply(Me)
        BuildDemoLoginUI()
    End Sub

    ''' <summary>Replace the username/password login with a role picker for the portfolio demo.</summary>
    Private Sub BuildDemoLoginUI()
        For Each c As Control In {CType(Panel1, Control), Panel2, Label1, Label2, LinkLabel1, Label3, Panel4}
            If c IsNot Nothing Then c.Visible = False
        Next

        Dim colW As Integer = 380
        Dim x As Integer = (Me.ClientSize.Width - colW) \ 2
        Dim y As Integer = Panel3.Bottom + 46

        Dim lblWelcome As New Label With {
            .Text = "Welcome back", .Location = New Point(x, y), .Size = New Size(colW, 34),
            .Font = New Font("Segoe UI Semibold", 19, FontStyle.Bold), .ForeColor = UiTheme.TextPrimary,
            .TextAlign = ContentAlignment.MiddleCenter, .BackColor = Color.Transparent}
        y += 40
        Dim lblSub As New Label With {
            .Text = "Sign in to explore the Guidance Records System demo", .Location = New Point(x, y),
            .Size = New Size(colW, 22), .Font = New Font("Segoe UI", 10), .ForeColor = UiTheme.TextSecondary,
            .TextAlign = ContentAlignment.MiddleCenter, .BackColor = Color.Transparent}
        y += 52

        Dim lblPick As New Label With {
            .Text = "CHOOSE A ROLE", .Location = New Point(x, y), .Size = New Size(colW, 18),
            .Font = New Font("Segoe UI Semibold", 8, FontStyle.Bold), .ForeColor = UiTheme.TextSecondary,
            .TextAlign = ContentAlignment.MiddleLeft, .BackColor = Color.Transparent}
        y += 24

        btnAdmin = MakeRoleButton("Continue as Admin", New Point(x, y), colW, filled:=True)
        AddHandler btnAdmin.Click, Sub() DoDemoLogin("admin")
        y += 62
        btnStaff = MakeRoleButton("Continue as Staff", New Point(x, y), colW, filled:=False)
        AddHandler btnStaff.Click, Sub() DoDemoLogin("user")
        y += 74

        Dim divider As New Panel With {
            .Location = New Point(x, y), .Size = New Size(colW, 1), .BackColor = UiTheme.BorderClr}
        y += 20

        btnResetDemo = New Button With {
            .Text = "↻   Reset demo data", .Location = New Point(x, y), .Size = New Size(colW, 38),
            .FlatStyle = FlatStyle.Flat, .BackColor = UiTheme.Surface, .ForeColor = UiTheme.TextSecondary,
            .Font = New Font("Segoe UI", 9.5F), .Cursor = Cursors.Hand}
        btnResetDemo.FlatAppearance.BorderSize = 0
        btnResetDemo.FlatAppearance.MouseOverBackColor = UiTheme.AppBg
        AddHandler btnResetDemo.Click, AddressOf ResetDemo_Click
        y += 40

        Dim lblHint As New Label With {
            .Text = "Restores all sample records to their original state.", .Location = New Point(x, y),
            .Size = New Size(colW, 18), .Font = New Font("Segoe UI", 8), .ForeColor = UiTheme.TextSecondary,
            .TextAlign = ContentAlignment.MiddleCenter, .BackColor = Color.Transparent}

        Me.Controls.AddRange({lblWelcome, lblSub, lblPick, btnAdmin, btnStaff, divider, btnResetDemo, lblHint})
        For Each c As Control In {CType(lblWelcome, Control), lblSub, lblPick, btnAdmin, btnStaff, divider, btnResetDemo, lblHint}
            c.BringToFront()
        Next
    End Sub

    Private Function MakeRoleButton(text As String, location As Point, width As Integer, filled As Boolean) As Button
        Dim b As New Button With {
            .Text = text, .Location = location, .Size = New Size(width, 50),
            .FlatStyle = FlatStyle.Flat, .Cursor = Cursors.Hand,
            .Font = New Font("Segoe UI Semibold", 11.5F, FontStyle.Bold),
            .TextAlign = ContentAlignment.MiddleCenter}
        If filled Then
            b.BackColor = UiTheme.PrimaryDark
            b.ForeColor = Color.White
            b.FlatAppearance.BorderSize = 0
            b.FlatAppearance.MouseOverBackColor = UiTheme.Primary
            b.FlatAppearance.MouseDownBackColor = UiTheme.PrimaryPressed
        Else
            b.BackColor = UiTheme.Surface
            b.ForeColor = UiTheme.PrimaryDark
            b.FlatAppearance.BorderSize = 1
            b.FlatAppearance.BorderColor = UiTheme.PrimaryDark
            b.FlatAppearance.MouseOverBackColor = UiTheme.PrimarySoft
            b.FlatAppearance.MouseDownBackColor = UiTheme.AccentSoft
        End If
        Return b
    End Function
#End Region

#Region "Database and Authentication"
    Private Sub EnsureDatabase()
        If Not File.Exists(dbPath) Then
            Using conn As New SqliteConnection(dbConnStr)
                conn.Open()
                Try
                    Using cmd As New SqliteCommand(
                    "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, role TEXT NOT NULL);", conn)
                        cmd.ExecuteNonQuery()
                    End Using
                    Using cmd As New SqliteCommand(
                    "CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, action TEXT, details TEXT, log_time DATETIME);", conn)
                        cmd.ExecuteNonQuery()
                    End Using
                    Using cmd As New SqliteCommand(
                    "CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, start_time DATETIME, end_time DATETIME);", conn)
                        cmd.ExecuteNonQuery()
                    End Using
                Catch ex As Exception
                    MessageBox.Show("Error creating tables: " & ex.Message)
                End Try
                Dim admin = PasswordHasher.Create("adminpass")
                Using cmd As New SqliteCommand(
                "INSERT INTO users (username, hash, salt, role) VALUES (@u, @h, @s, @r)", conn)
                    cmd.Parameters.AddWithValue("@u", "admin")
                    cmd.Parameters.AddWithValue("@h", admin.Hash)
                    cmd.Parameters.AddWithValue("@s", admin.Salt)
                    cmd.Parameters.AddWithValue("@r", "admin")
                    cmd.ExecuteNonQuery()
                End Using
            End Using
        End If
    End Sub

    Public Sub AddUserToDB(username As String, password As String, role As String)
        Dim record = PasswordHasher.Create(password)
        Using conn As New SqliteConnection(dbConnStr)
            conn.Open()
            Using cmd As New SqliteCommand("INSERT INTO users (username, hash, salt, role) VALUES (@u, @h, @s, @r)", conn)
                cmd.Parameters.AddWithValue("@u", username)
                cmd.Parameters.AddWithValue("@h", record.Hash)
                cmd.Parameters.AddWithValue("@s", record.Salt)
                cmd.Parameters.AddWithValue("@r", role)
                cmd.ExecuteNonQuery()
            End Using
        End Using
    End Sub

#End Region

#Region "UI Logic and Events"
    ''' <summary>Demo login: pick a role, no credentials.</summary>
    Private Sub DoDemoLogin(role As String)
        CurrentRole = role
        Dim username As String = If(role = "admin", "demo-admin", "demo-staff")
        Dim sid As Integer = -1

        Try
            Using conn As New SqliteConnection(dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("INSERT INTO sessions (username, start_time) VALUES (@u, @t); SELECT last_insert_rowid();", conn)
                    cmd.Parameters.AddWithValue("@u", username)
                    cmd.Parameters.AddWithValue("@t", DateTime.Now)
                    sid = Convert.ToInt32(cmd.ExecuteScalar())
                End Using
            End Using
            AuditLog.Write(dbConnStr, username, "login_success", "Demo login as " & role)
        Catch
            ' Session/audit are best-effort in the demo — never block login on them.
        End Try

        Dim mainForm As New Form1(Me, username, role, sid)
        Me.Hide()
        mainForm.Show()
    End Sub

    Private Sub ResetDemo_Click(sender As Object, e As EventArgs)
        If MessageBox.Show("Restore the demo data to its original state? Any changes you made will be discarded.",
                           "Reset Demo", MessageBoxButtons.YesNo, MessageBoxIcon.Question) <> DialogResult.Yes Then Return
        Try
            Me.Cursor = Cursors.WaitCursor
            DemoSeeder.ResetDemoData()
            MessageBox.Show("Demo data has been reset to its original state.", "Reset Demo",
                            MessageBoxButtons.OK, MessageBoxIcon.Information)
        Catch ex As Exception
            AppLogger.WriteLog($"Reset demo failed: {ex.Message}")
            MessageBox.Show("Reset failed: " & ex.Message, "Reset Demo", MessageBoxButtons.OK, MessageBoxIcon.Error)
        Finally
            Me.Cursor = Cursors.Default
        End Try
    End Sub

#End Region

#Region "Custom Painting & UI Design"
    Private Sub Panel3_Paint(sender As Object, e As PaintEventArgs) Handles Panel3.Paint
        e.Graphics.SmoothingMode = Drawing2D.SmoothingMode.AntiAlias
        Dim radius As Integer = 30
        Dim rect As New Rectangle(0, 0, Panel3.Width, Panel3.Height)
        Using path As New Drawing2D.GraphicsPath()
            path.StartFigure()
            path.AddArc(rect.X, rect.Y, radius, radius, 180, 90)
            path.AddLine(rect.X + radius, rect.Y, rect.Right - radius, rect.Y)
            path.AddArc(rect.Right - radius, rect.Y, radius, radius, 270, 90)
            path.AddLine(rect.Right, rect.Y + radius, rect.Right, rect.Bottom)
            path.AddLine(rect.Right, rect.Bottom, rect.Left, rect.Bottom)
            path.AddLine(rect.Left, rect.Bottom, rect.Left, rect.Y + radius)
            path.CloseFigure()
            Using brush As New SolidBrush(Panel3.BackColor)
                e.Graphics.FillPath(brush, path)
            End Using
            Dim old = Panel3.Region
            Panel3.Region = New Region(path)
            old?.Dispose()
        End Using
    End Sub
#End Region

#Region "Form Region"
    Protected Overrides Sub OnPaint(e As PaintEventArgs)
        MyBase.OnPaint(e)
        e.Graphics.SmoothingMode = Drawing2D.SmoothingMode.AntiAlias
        Dim radius As Integer = 30
        Dim thickness As Integer = 4
        Dim rect As New Rectangle(thickness \ 2, thickness \ 2, Me.ClientSize.Width - thickness, Me.ClientSize.Height - thickness)
        Using pen As New Pen(UiTheme.Accent, thickness)
            Using path As New Drawing2D.GraphicsPath()
                path.AddArc(rect.X, rect.Y, radius, radius, 180, 90)
                path.AddArc(rect.Right - radius, rect.Y, radius, radius, 270, 90)
                path.AddArc(rect.Right - radius, rect.Bottom - radius, radius, radius, 0, 90)
                path.AddArc(rect.X, rect.Bottom - radius, radius, radius, 90, 90)
                path.CloseFigure()
                e.Graphics.DrawPath(pen, path)
            End Using
        End Using
    End Sub

    Protected Overrides Sub OnResize(e As EventArgs)
        MyBase.OnResize(e)
        SetFormRegion()
    End Sub

    Protected Overrides Sub OnHandleCreated(e As EventArgs)
        MyBase.OnHandleCreated(e)
        SetFormRegion()
    End Sub

    Private Sub SetFormRegion()
        Dim radius As Integer = 30
        Using path As New GraphicsPath()
            path.StartFigure()
            path.AddArc(0, 0, radius, radius, 180, 90)
            path.AddArc(Me.Width - radius, 0, radius, radius, 270, 90)
            path.AddArc(Me.Width - radius, Me.Height - radius, radius, radius, 0, 90)
            path.AddArc(0, Me.Height - radius, radius, radius, 90, 90)
            path.CloseFigure()
            Dim old = Me.Region
            Me.Region = New Region(path)
            old?.Dispose()
        End Using
    End Sub

#End Region

#Region "Auxiliary Button Events"
    Private Sub PictureBox3_Click(sender As Object, e As EventArgs) Handles PictureBox3.Click
        Application.Exit()
    End Sub

    Private Sub PictureBox4_Click(sender As Object, e As EventArgs) Handles PictureBox4.Click
        Me.WindowState = FormWindowState.Minimized
    End Sub
#End Region

End Class
