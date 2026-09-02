Imports Microsoft.Data.Sqlite

Public Class Form1

#Region "Fields & Properties"
    Private drag As Boolean
    Private mouseX As Integer
    Private mouseY As Integer

    Private loginForm As LoginForm
    Private isLoggingOut As Boolean = False
    Public Property CurrentRole As String
    Public Property CurrentUser As String
    Public Property LastSessionId As Integer

    Private navPanels() As Panel
    Private selectedPanel As Panel = Nothing
    Private navLabels() As Label
    Private selectedLabel As Label = Nothing
    Private Settingsactivated As Boolean = False


#End Region

#Region "Form Initialization"

    Public Sub New(lf As LoginForm, username As String, role As String, sessionId As Integer)
        InitializeComponent()
        loginForm = lf
        CurrentUser = username
        CurrentRole = role
        LastSessionId = sessionId
    End Sub

    Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Try
            DemoSeeder.EnsureSeededOnce()
            TemplateBootstrapper.EnsureDemoTemplates()
        Catch ex As Exception
            AppLogger.WriteLog($"Startup data initialization failed: {ex.Message}")
            MessageBox.Show("Could not initialize the demo data. See the log for details.", "Startup", MessageBoxButtons.OK, MessageBoxIcon.Warning)
        End Try
        navPanels = {Panel4, Panel5, Panel6, Panel8, Panel11}
        navLabels = {Label1, Label2, Label3, Label4, Label6}
        For Each pnl As Panel In navPanels
            UiTheme.Round(pnl, 10)
        Next

        Panel4.BackColor = UiTheme.Accent
        Label1.BackColor = UiTheme.Accent
        selectedPanel = Panel4
        selectedLabel = Label1
        Panel4.Cursor = Cursors.Hand
        Label1.Cursor = Cursors.Hand

        Me.FormBorderStyle = FormBorderStyle.None

        Dim dash As New Dashboard()
        LoadFormContent(dash)

        If String.IsNullOrEmpty(CurrentUser) Then
            MessageBox.Show("You must log in first.")
            Application.Exit()
            Return
        End If

        UpdateUsernameDisplay()

        ' Header bar sits on deep red — keep its text light.
        Label9.ForeColor = Color.White
        Label8.ForeColor = Color.White

        ' Demo build: cloud backup/restore is disabled — hide its menu actions.
        Button1.Visible = False
        Button2.Visible = False
        Button4.Visible = False

        AddHidePanelHandlerRecursive(Me)
    End Sub

    Private Sub UpdateUsernameDisplay()
        If Not String.IsNullOrEmpty(CurrentUser) Then
            Dim displayName As String = CurrentUser
            If displayName.Length > 0 Then
                displayName = Char.ToUpper(displayName(0)) & displayName.Substring(1).ToLower()
            End If

            Label5.Text = displayName
            Label5.Visible = True
            Label7.Text = $"{CurrentRole}"
            Label7.Visible = True
        End If
    End Sub

#End Region

#Region "Navigation Panel Events"

    Private Sub NavPanel_Click(sender As Object, e As MouseEventArgs) _
        Handles Panel4.Click, Label1.Click,
                Panel5.Click, Label2.Click,
                Panel6.Click, Label3.Click,
                Panel8.Click, Label4.Click,
                Panel11.Click, Label6.Click

        For Each pnl As Panel In navPanels
            pnl.BackColor = UiTheme.PrimaryDark
        Next
        For Each lbl As Label In navLabels
            lbl.BackColor = UiTheme.PrimaryDark
        Next

        Dim contentToLoad As UserControl = Nothing
        Dim ctrl As Control = CType(sender, Control)
        If ctrl Is Panel4 OrElse ctrl Is Label1 OrElse ctrl Is PictureBox1 Then
            Panel4.BackColor = UiTheme.Accent
            Label1.BackColor = UiTheme.Accent
            selectedPanel = Panel4
            selectedLabel = Label1
            contentToLoad = New Dashboard()
            Label9.Text = "Dashboard Overview"
        ElseIf ctrl Is Panel5 OrElse ctrl Is Label2 OrElse ctrl Is PictureBox2 Then
            Panel5.BackColor = UiTheme.Accent
            Label2.BackColor = UiTheme.Accent
            selectedPanel = Panel5
            selectedLabel = Label2
            contentToLoad = New Records()
            Label9.Text = "Record Management"
        ElseIf ctrl Is Panel6 OrElse ctrl Is Label3 OrElse ctrl Is PictureBox3 Then
            Panel6.BackColor = UiTheme.Accent
            Label3.BackColor = UiTheme.Accent
            selectedPanel = Panel6
            selectedLabel = Label3
            contentToLoad = New Reports()
            Label9.Text = "Reports Management"
        ElseIf ctrl Is Panel8 OrElse ctrl Is Label4 OrElse ctrl Is PictureBox4 Then
            Panel8.BackColor = UiTheme.Accent
            Label4.BackColor = UiTheme.Accent
            selectedPanel = Panel8
            selectedLabel = Label4
            contentToLoad = New Templates()
            Label9.Text = "Document Templates"
        End If

        If contentToLoad IsNot Nothing Then
            LoadFormContent(contentToLoad)
        End If
    End Sub

    Private Sub SharedHoverHandler(sender As Object, e As EventArgs) _
        Handles Panel4.MouseEnter, Label1.MouseEnter,
                Panel5.MouseEnter, Label2.MouseEnter,
                Panel6.MouseEnter, Label3.MouseEnter,
                Panel8.MouseEnter, Label4.MouseEnter,
                Panel11.MouseEnter, Label6.MouseEnter

        Dim ctrl As Control = CType(sender, Control)
        If (ctrl Is Panel4 OrElse ctrl Is Label1) AndAlso (selectedPanel IsNot Panel4 OrElse selectedLabel IsNot Label1) Then
            Panel4.BackColor = UiTheme.Primary
            Label1.BackColor = UiTheme.Primary
            Panel4.Cursor = Cursors.Hand
            Label1.Cursor = Cursors.Hand
        ElseIf (ctrl Is Panel5 OrElse ctrl Is Label2) AndAlso (selectedPanel IsNot Panel5 OrElse selectedLabel IsNot Label2) Then
            Panel5.BackColor = UiTheme.Primary
            Label2.BackColor = UiTheme.Primary
            Panel5.Cursor = Cursors.Hand
            Label2.Cursor = Cursors.Hand
        ElseIf (ctrl Is Panel6 OrElse ctrl Is Label3) AndAlso (selectedPanel IsNot Panel6 OrElse selectedLabel IsNot Label3) Then
            Panel6.BackColor = UiTheme.Primary
            Label3.BackColor = UiTheme.Primary
            Panel6.Cursor = Cursors.Hand
            Label3.Cursor = Cursors.Hand
        ElseIf (ctrl Is Panel8 OrElse ctrl Is Label4) AndAlso (selectedPanel IsNot Panel8 OrElse selectedLabel IsNot Label4) Then
            Panel8.BackColor = UiTheme.Primary
            Label4.BackColor = UiTheme.Primary
            Panel8.Cursor = Cursors.Hand
            Label4.Cursor = Cursors.Hand
        ElseIf (ctrl Is Panel11 OrElse ctrl Is Label6) AndAlso (selectedPanel IsNot Panel11 OrElse selectedLabel IsNot Label6) Then
            Panel11.BackColor = UiTheme.Primary
            Label6.BackColor = UiTheme.Primary
            Panel11.Cursor = Cursors.Hand
            Label6.Cursor = Cursors.Hand
        End If
    End Sub

    Private Sub SharedHoverLeaveHandler(sender As Object, e As EventArgs) _
    Handles Panel4.MouseLeave, Label1.MouseLeave,
            Panel5.MouseLeave, Label2.MouseLeave,
            Panel6.MouseLeave, Label3.MouseLeave,
            Panel8.MouseLeave, Label4.MouseLeave,
            Panel11.MouseLeave, Label6.MouseLeave

        Dim ctrl As Control = CType(sender, Control)
        If (ctrl Is Panel4 OrElse ctrl Is Label1) AndAlso (selectedPanel IsNot Panel4 OrElse selectedLabel IsNot Label1) Then
            Panel4.BackColor = UiTheme.PrimaryDark
            Label1.BackColor = UiTheme.PrimaryDark
        ElseIf (ctrl Is Panel5 OrElse ctrl Is Label2) AndAlso (selectedPanel IsNot Panel5 OrElse selectedLabel IsNot Label2) Then
            Panel5.BackColor = UiTheme.PrimaryDark
            Label2.BackColor = UiTheme.PrimaryDark
        ElseIf (ctrl Is Panel6 OrElse ctrl Is Label3) AndAlso (selectedPanel IsNot Panel6 OrElse selectedLabel IsNot Label3) Then
            Panel6.BackColor = UiTheme.PrimaryDark
            Label3.BackColor = UiTheme.PrimaryDark
        ElseIf (ctrl Is Panel8 OrElse ctrl Is Label4) AndAlso (selectedPanel IsNot Panel8 OrElse selectedLabel IsNot Label4) Then
            Panel8.BackColor = UiTheme.PrimaryDark
            Label4.BackColor = UiTheme.PrimaryDark
        ElseIf (ctrl Is Panel11 OrElse ctrl Is Label6) AndAlso (selectedPanel IsNot Panel11 OrElse selectedLabel IsNot Label6) Then
            Panel11.BackColor = UiTheme.PrimaryDark
            Label6.BackColor = UiTheme.PrimaryDark
        End If
    End Sub

    Private Sub AddHidePanelHandlerRecursive(ctrl As Control)
        If ctrl IsNot Panel10 AndAlso ctrl IsNot Button2 AndAlso ctrl IsNot Button6 AndAlso ctrl IsNot Label8 AndAlso ctrl IsNot Button1 AndAlso ctrl IsNot Button3 AndAlso ctrl IsNot Button4 Then
            AddHandler ctrl.MouseDown, AddressOf HidePanel10IfVisible
        End If
        For Each child As Control In ctrl.Controls
            AddHidePanelHandlerRecursive(child)
        Next
    End Sub

    Private Sub HidePanel10IfVisible(sender As Object, e As MouseEventArgs)
        If Panel10.Visible Then Panel10.Visible = False
    End Sub




#End Region

#Region "Dashboard & Content"

    Private Sub LoadFormContent(control As UserControl)
        Dim outgoing = If(Panel7.Controls.Count > 0, Panel7.Controls(0), Nothing)
        Panel7.Controls.Clear()
        outgoing?.Dispose()
        control.Dock = DockStyle.Fill
        Panel7.Controls.Add(control)
    End Sub

#End Region

#Region "Session & Audit Logging"

    Private Sub Panel11_Click(sender As Object, e As MouseEventArgs) Handles Panel11.Click, Label6.Click
        isLoggingOut = True
        EndSession(CurrentUser)
        AuditLog.Write(loginForm.dbConnStr, CurrentUser, "logout", "User logged out.")
        loginForm.Show()
        Close()
    End Sub

    Private Sub Form1_FormClosed(sender As Object, e As FormClosedEventArgs) Handles Me.FormClosed
        If Not isLoggingOut AndAlso Not String.IsNullOrEmpty(CurrentUser) Then
            EndSession(CurrentUser)
            AuditLog.Write(loginForm.dbConnStr, CurrentUser, "app_exit", "App closed without logging out.")
            Application.Exit()
        End If
    End Sub

    Private Sub EndSession(username As String)
        If LastSessionId > 0 AndAlso Not String.IsNullOrEmpty(username) Then
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("UPDATE sessions SET end_time=@t WHERE id=@id", conn)
                    cmd.Parameters.AddWithValue("@t", DateTime.UtcNow)
                    cmd.Parameters.AddWithValue("@id", LastSessionId)
                    cmd.ExecuteNonQuery()
                End Using
            End Using
        End If
    End Sub

#End Region

#Region "Form Move & Resize"

    Private Sub PopupForm_MouseDown(sender As Object, e As MouseEventArgs) Handles MyBase.MouseDown
        drag = True
        mouseX = Cursor.Position.X - Me.Left
        mouseY = Cursor.Position.Y - Me.Top
    End Sub

    Private Sub PopupForm_MouseMove(sender As Object, e As MouseEventArgs) Handles MyBase.MouseMove
        If drag Then
            Me.Left = Cursor.Position.X - mouseX
            Me.Top = Cursor.Position.Y - mouseY
        End If
    End Sub

    Private Sub PopupForm_MouseUp(sender As Object, e As MouseEventArgs) Handles MyBase.MouseUp
        drag = False
    End Sub

    Protected Overrides Sub OnResize(e As EventArgs)
        MyBase.OnResize(e)
        Const navHeight As Integer = 50
        Const navBorder As Integer = -10
        Panel7.Location = New Point(Panel1.Width - 3, navHeight)
        Panel7.Size = New Size(Me.ClientSize.Width - Panel1.Width - navBorder, Me.ClientSize.Height - navHeight - navBorder)
    End Sub

#End Region

#Region "Painting & Style"

    Protected Overrides Sub OnPaint(e As PaintEventArgs)
        MyBase.OnPaint(e)
        Using pen As New Pen(Color.Black, 1)
            e.Graphics.DrawRectangle(pen, 0, 0, Me.ClientSize.Width - 1, Me.ClientSize.Height - 1)
        End Using
    End Sub

    Private Sub Panel9_Paint(sender As Object, e As PaintEventArgs) Handles Panel9.Paint
        e.Graphics.SmoothingMode = Drawing2D.SmoothingMode.AntiAlias
        Dim rect As New Rectangle(0, 0, Panel9.Width, Panel9.Height)
        Using brush As New SolidBrush(UiTheme.PrimaryDark)
            e.Graphics.FillRectangle(brush, rect)
        End Using
        ' thin gold rule along the bottom edge for a bit of brand warmth
        Using p As New Pen(UiTheme.Accent, 3)
            e.Graphics.DrawLine(p, 0, Panel9.Height - 2, Panel9.Width, Panel9.Height - 2)
        End Using
    End Sub

#End Region

#Region "Settings Menu"

    Private Sub Button6_Click(sender As Object, e As EventArgs) Handles Button6.Click
        Panel10.Visible = False
        Dim popup As New UserManagementForm(Me, loginForm)
        popup.ShowDialog(Me)
    End Sub

    Private Sub Label8_Click(sender As Object, e As EventArgs) Handles Label8.Click
        Dim dropdownForm As Form = Me
        Dim panelPosition As Point = Panel9.PointToScreen(New Point(Label8.Left - 80, Label8.Bottom))
        panelPosition = dropdownForm.PointToClient(panelPosition)

        ' Move Panel10 to be a direct child of the form
        Panel10.Location = panelPosition
        Panel10.Parent = dropdownForm
        Panel10.BringToFront()

        ' Toggle its visibility
        If Settingsactivated = False Then
            Panel10.Visible = True
            Settingsactivated = True
        Else
            Panel10.Visible = False
            Settingsactivated = False
        End If
    End Sub

    Private Sub Button3_Click(sender As Object, e As EventArgs) Handles Button3.Click
        Panel10.Visible = False
        Dim aboutText As String = "System Name: Guinayang Guidance Tracking and Management System" & vbCrLf &
                              "Creators: Sarmiento, James Kerby C." & vbCrLf &
                              "          Flores, Felves" & vbCrLf &
                              "          Francisco, Angela" & vbCrLf &
                              "          Cabales, Biboy" & vbCrLf &
                              "          Tomobo, Andrea" & vbCrLf &
                              "Donated to: Guinayang National High School" & vbCrLf &
                              "Date Created: November 2025" & vbCrLf &
                              "Version: 1.0.0" & vbCrLf & vbCrLf &
                              "Description: This system is designed to manage student records efficiently and securely, with features for backup, restoration, and user authentication."
        MessageBox.Show(aboutText, "About Us", MessageBoxButtons.OK, MessageBoxIcon.Information)
    End Sub

#End Region
End Class
