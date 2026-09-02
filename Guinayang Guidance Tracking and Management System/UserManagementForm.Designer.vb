<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class UserManagementForm
    Inherits System.Windows.Forms.Form

    'Form overrides dispose to clean up the component list.
    <System.Diagnostics.DebuggerNonUserCode()> _
    Protected Overrides Sub Dispose(ByVal disposing As Boolean)
        Try
            If disposing AndAlso components IsNot Nothing Then
                components.Dispose()
            End If
        Finally
            MyBase.Dispose(disposing)
        End Try
    End Sub

    'Required by the Windows Form Designer
    Private components As System.ComponentModel.IContainer

    'NOTE: The following procedure is required by the Windows Form Designer
    'It can be modified using the Windows Form Designer.  
    'Do not modify it using the code editor.
    <System.Diagnostics.DebuggerStepThrough()> _
    Private Sub InitializeComponent()
        Dim DataGridViewCellStyle1 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle2 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle3 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle4 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle5 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(UserManagementForm))
        TabControl1 = New TabControl()
        TabPage1 = New TabPage()
        TableLayoutPanel1 = New TableLayoutPanel()
        DataGridView1 = New DataGridView()
        colUsername = New DataGridViewTextBoxColumn()
        colRole = New DataGridViewTextBoxColumn()
        Panel1 = New Panel()
        lblAdminOnly = New Label()
        TableLayoutPanel2 = New TableLayoutPanel()
        btnEditUser = New Button()
        btnDeleteUser = New Button()
        btnAddUser = New Button()
        TabPage2 = New TabPage()
        btnChangePassword = New Button()
        txtConfirmPassword = New TextBox()
        Label3 = New Label()
        txtNewPassword = New TextBox()
        Label2 = New Label()
        txtCurrentPassword = New TextBox()
        Label1 = New Label()
        lblChangeOwnPassword = New Label()
        TabControl1.SuspendLayout()
        TabPage1.SuspendLayout()
        TableLayoutPanel1.SuspendLayout()
        CType(DataGridView1, ComponentModel.ISupportInitialize).BeginInit()
        Panel1.SuspendLayout()
        TableLayoutPanel2.SuspendLayout()
        TabPage2.SuspendLayout()
        SuspendLayout()
        ' 
        ' TabControl1
        ' 
        TabControl1.Controls.Add(TabPage1)
        TabControl1.Controls.Add(TabPage2)
        TabControl1.Dock = DockStyle.Fill
        TabControl1.Location = New Point(0, 0)
        TabControl1.Name = "TabControl1"
        TabControl1.SelectedIndex = 0
        TabControl1.Size = New Size(527, 337)
        TabControl1.TabIndex = 1
        ' 
        ' TabPage1
        ' 
        TabPage1.Controls.Add(TableLayoutPanel1)
        TabPage1.Location = New Point(4, 29)
        TabPage1.Name = "TabPage1"
        TabPage1.Padding = New Padding(3)
        TabPage1.Size = New Size(519, 304)
        TabPage1.TabIndex = 0
        TabPage1.Text = "User Management"
        TabPage1.UseVisualStyleBackColor = True
        ' 
        ' TableLayoutPanel1
        ' 
        TableLayoutPanel1.BackColor = Color.FromArgb(CByte(224), CByte(224), CByte(224))
        TableLayoutPanel1.ColumnCount = 7
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.334495366F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 25.1473484F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.334495246F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 47.34774F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.334495246F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 25.9332027F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.334495246F))
        TableLayoutPanel1.Controls.Add(DataGridView1, 1, 3)
        TableLayoutPanel1.Controls.Add(Panel1, 3, 1)
        TableLayoutPanel1.Controls.Add(TableLayoutPanel2, 3, 5)
        TableLayoutPanel1.Dock = DockStyle.Fill
        TableLayoutPanel1.Location = New Point(3, 3)
        TableLayoutPanel1.Name = "TableLayoutPanel1"
        TableLayoutPanel1.RowCount = 7
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.7462686F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 11.8421049F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.7462686F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 70.06579F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.7462686F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 14.9253731F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.7462686F))
        TableLayoutPanel1.Size = New Size(513, 298)
        TableLayoutPanel1.TabIndex = 5
        ' 
        ' DataGridView1
        ' 
        DataGridView1.AllowUserToAddRows = False
        DataGridView1.AllowUserToDeleteRows = False
        DataGridView1.AllowUserToResizeColumns = False
        DataGridView1.AllowUserToResizeRows = False
        DataGridViewCellStyle1.BackColor = Color.Gainsboro
        DataGridView1.AlternatingRowsDefaultCellStyle = DataGridViewCellStyle1
        DataGridView1.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
        DataGridView1.BackgroundColor = Color.White
        DataGridViewCellStyle2.Alignment = DataGridViewContentAlignment.MiddleCenter
        DataGridViewCellStyle2.BackColor = Color.Black
        DataGridViewCellStyle2.Font = New Font("Segoe UI", 10.8F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        DataGridViewCellStyle2.ForeColor = Color.White
        DataGridViewCellStyle2.SelectionBackColor = SystemColors.GradientActiveCaption
        DataGridViewCellStyle2.SelectionForeColor = Color.White
        DataGridViewCellStyle2.WrapMode = DataGridViewTriState.True
        DataGridView1.ColumnHeadersDefaultCellStyle = DataGridViewCellStyle2
        DataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize
        DataGridView1.Columns.AddRange(New DataGridViewColumn() {colUsername, colRole})
        TableLayoutPanel1.SetColumnSpan(DataGridView1, 5)
        DataGridViewCellStyle3.Alignment = DataGridViewContentAlignment.MiddleCenter
        DataGridViewCellStyle3.BackColor = Color.White
        DataGridViewCellStyle3.Font = New Font("Segoe UI", 9F)
        DataGridViewCellStyle3.ForeColor = SystemColors.ControlText
        DataGridViewCellStyle3.SelectionBackColor = SystemColors.Highlight
        DataGridViewCellStyle3.SelectionForeColor = Color.White
        DataGridViewCellStyle3.WrapMode = DataGridViewTriState.False
        DataGridView1.DefaultCellStyle = DataGridViewCellStyle3
        DataGridView1.Dock = DockStyle.Fill
        DataGridView1.Location = New Point(4, 42)
        DataGridView1.Name = "DataGridView1"
        DataGridView1.ReadOnly = True
        DataGridViewCellStyle4.Alignment = DataGridViewContentAlignment.MiddleLeft
        DataGridViewCellStyle4.BackColor = Color.White
        DataGridViewCellStyle4.Font = New Font("Segoe UI", 9F)
        DataGridViewCellStyle4.ForeColor = SystemColors.WindowText
        DataGridViewCellStyle4.SelectionBackColor = SystemColors.Highlight
        DataGridViewCellStyle4.SelectionForeColor = Color.White
        DataGridViewCellStyle4.WrapMode = DataGridViewTriState.True
        DataGridView1.RowHeadersDefaultCellStyle = DataGridViewCellStyle4
        DataGridView1.RowHeadersVisible = False
        DataGridView1.RowHeadersWidth = 51
        DataGridViewCellStyle5.BackColor = Color.White
        DataGridViewCellStyle5.ForeColor = Color.Black
        DataGridViewCellStyle5.SelectionBackColor = Color.White
        DataGridViewCellStyle5.SelectionForeColor = Color.Black
        DataGridView1.RowsDefaultCellStyle = DataGridViewCellStyle5
        DataGridView1.RowTemplate.Height = 35
        DataGridView1.SelectionMode = DataGridViewSelectionMode.FullRowSelect
        DataGridView1.Size = New Size(501, 203)
        DataGridView1.TabIndex = 0
        ' 
        ' colUsername
        ' 
        colUsername.HeaderText = "Username"
        colUsername.MinimumWidth = 6
        colUsername.Name = "colUsername"
        colUsername.ReadOnly = True
        ' 
        ' colRole
        ' 
        colRole.HeaderText = "Role"
        colRole.MinimumWidth = 6
        colRole.Name = "colRole"
        colRole.ReadOnly = True
        ' 
        ' Panel1
        ' 
        Panel1.Controls.Add(lblAdminOnly)
        Panel1.Dock = DockStyle.Fill
        Panel1.Location = New Point(134, 5)
        Panel1.Name = "Panel1"
        Panel1.Size = New Size(237, 29)
        Panel1.TabIndex = 5
        ' 
        ' lblAdminOnly
        ' 
        lblAdminOnly.AutoSize = True
        lblAdminOnly.Font = New Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        lblAdminOnly.ForeColor = Color.Red
        lblAdminOnly.Location = New Point(29, 0)
        lblAdminOnly.Name = "lblAdminOnly"
        lblAdminOnly.Size = New Size(171, 28)
        lblAdminOnly.TabIndex = 4
        lblAdminOnly.Text = "Admin Functions"
        ' 
        ' TableLayoutPanel2
        ' 
        TableLayoutPanel2.ColumnCount = 3
        TableLayoutPanel2.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 33.3333321F))
        TableLayoutPanel2.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 33.3333321F))
        TableLayoutPanel2.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 33.3333321F))
        TableLayoutPanel2.Controls.Add(btnEditUser, 1, 0)
        TableLayoutPanel2.Controls.Add(btnDeleteUser, 2, 0)
        TableLayoutPanel2.Controls.Add(btnAddUser, 0, 0)
        TableLayoutPanel2.Location = New Point(134, 253)
        TableLayoutPanel2.Name = "TableLayoutPanel2"
        TableLayoutPanel2.RowCount = 1
        TableLayoutPanel2.RowStyles.Add(New RowStyle(SizeType.Percent, 76.92308F))
        TableLayoutPanel2.Size = New Size(235, 38)
        TableLayoutPanel2.TabIndex = 6
        ' 
        ' btnEditUser
        ' 
        btnEditUser.Dock = DockStyle.Fill
        btnEditUser.Location = New Point(81, 3)
        btnEditUser.Name = "btnEditUser"
        btnEditUser.Size = New Size(72, 32)
        btnEditUser.TabIndex = 2
        btnEditUser.Text = "Edit User"
        btnEditUser.UseVisualStyleBackColor = True
        ' 
        ' btnDeleteUser
        ' 
        btnDeleteUser.BackColor = Color.Salmon
        btnDeleteUser.Dock = DockStyle.Fill
        btnDeleteUser.Location = New Point(159, 3)
        btnDeleteUser.Name = "btnDeleteUser"
        btnDeleteUser.Size = New Size(73, 32)
        btnDeleteUser.TabIndex = 3
        btnDeleteUser.Text = "Delete User"
        btnDeleteUser.UseVisualStyleBackColor = False
        ' 
        ' btnAddUser
        ' 
        btnAddUser.BackColor = Color.LightGreen
        btnAddUser.Dock = DockStyle.Fill
        btnAddUser.Location = New Point(3, 3)
        btnAddUser.Name = "btnAddUser"
        btnAddUser.Size = New Size(72, 32)
        btnAddUser.TabIndex = 1
        btnAddUser.Text = "Add User"
        btnAddUser.UseVisualStyleBackColor = False
        ' 
        ' TabPage2
        ' 
        TabPage2.Controls.Add(btnChangePassword)
        TabPage2.Controls.Add(txtConfirmPassword)
        TabPage2.Controls.Add(Label3)
        TabPage2.Controls.Add(txtNewPassword)
        TabPage2.Controls.Add(Label2)
        TabPage2.Controls.Add(txtCurrentPassword)
        TabPage2.Controls.Add(Label1)
        TabPage2.Controls.Add(lblChangeOwnPassword)
        TabPage2.Location = New Point(4, 29)
        TabPage2.Name = "TabPage2"
        TabPage2.Padding = New Padding(3)
        TabPage2.Size = New Size(519, 304)
        TabPage2.TabIndex = 1
        TabPage2.Text = "Change Password"
        TabPage2.UseVisualStyleBackColor = True
        ' 
        ' btnChangePassword
        ' 
        btnChangePassword.Location = New Point(184, 228)
        btnChangePassword.Name = "btnChangePassword"
        btnChangePassword.Size = New Size(140, 29)
        btnChangePassword.TabIndex = 7
        btnChangePassword.Text = "Change Password"
        btnChangePassword.UseVisualStyleBackColor = True
        ' 
        ' txtConfirmPassword
        ' 
        txtConfirmPassword.Location = New Point(224, 178)
        txtConfirmPassword.Name = "txtConfirmPassword"
        txtConfirmPassword.Size = New Size(200, 27)
        txtConfirmPassword.TabIndex = 6
        txtConfirmPassword.UseSystemPasswordChar = True
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.Location = New Point(91, 181)
        Label3.Name = "Label3"
        Label3.Size = New Size(130, 20)
        Label3.TabIndex = 5
        Label3.Text = "Confirm Password:"
        ' 
        ' txtNewPassword
        ' 
        txtNewPassword.Location = New Point(224, 141)
        txtNewPassword.Name = "txtNewPassword"
        txtNewPassword.Size = New Size(200, 27)
        txtNewPassword.TabIndex = 4
        txtNewPassword.UseSystemPasswordChar = True
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.Location = New Point(114, 147)
        Label2.Name = "Label2"
        Label2.Size = New Size(107, 20)
        Label2.TabIndex = 3
        Label2.Text = "New Password:"
        ' 
        ' txtCurrentPassword
        ' 
        txtCurrentPassword.Location = New Point(224, 106)
        txtCurrentPassword.Name = "txtCurrentPassword"
        txtCurrentPassword.Size = New Size(200, 27)
        txtCurrentPassword.TabIndex = 2
        txtCurrentPassword.UseSystemPasswordChar = True
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Location = New Point(96, 116)
        Label1.Name = "Label1"
        Label1.Size = New Size(125, 20)
        Label1.TabIndex = 1
        Label1.Text = "Current Password:"
        ' 
        ' lblChangeOwnPassword
        ' 
        lblChangeOwnPassword.AutoSize = True
        lblChangeOwnPassword.Font = New Font("Segoe UI", 13.8F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        lblChangeOwnPassword.Location = New Point(91, 55)
        lblChangeOwnPassword.Name = "lblChangeOwnPassword"
        lblChangeOwnPassword.Size = New Size(348, 31)
        lblChangeOwnPassword.TabIndex = 0
        lblChangeOwnPassword.Text = "Change Password for [username]"
        ' 
        ' UserManagementForm
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        ClientSize = New Size(527, 337)
        Controls.Add(TabControl1)
        Icon = CType(resources.GetObject("$this.Icon"), Icon)
        Name = "UserManagementForm"
        StartPosition = FormStartPosition.CenterScreen
        Text = "UserManagementForm"
        TabControl1.ResumeLayout(False)
        TabPage1.ResumeLayout(False)
        TableLayoutPanel1.ResumeLayout(False)
        CType(DataGridView1, ComponentModel.ISupportInitialize).EndInit()
        Panel1.ResumeLayout(False)
        Panel1.PerformLayout()
        TableLayoutPanel2.ResumeLayout(False)
        TabPage2.ResumeLayout(False)
        TabPage2.PerformLayout()
        ResumeLayout(False)
    End Sub

    Friend WithEvents TabControl1 As TabControl
    Friend WithEvents TabPage1 As TabPage
    Friend WithEvents TableLayoutPanel1 As TableLayoutPanel
    Friend WithEvents DataGridView1 As DataGridView
    Friend WithEvents colUsername As DataGridViewTextBoxColumn
    Friend WithEvents colRole As DataGridViewTextBoxColumn
    Friend WithEvents Panel1 As Panel
    Friend WithEvents lblAdminOnly As Label
    Friend WithEvents TableLayoutPanel2 As TableLayoutPanel
    Friend WithEvents btnEditUser As Button
    Friend WithEvents btnDeleteUser As Button
    Friend WithEvents btnAddUser As Button
    Friend WithEvents TabPage2 As TabPage
    Friend WithEvents btnChangePassword As Button
    Friend WithEvents txtConfirmPassword As TextBox
    Friend WithEvents Label3 As Label
    Friend WithEvents txtNewPassword As TextBox
    Friend WithEvents Label2 As Label
    Friend WithEvents txtCurrentPassword As TextBox
    Friend WithEvents Label1 As Label
    Friend WithEvents lblChangeOwnPassword As Label
End Class
