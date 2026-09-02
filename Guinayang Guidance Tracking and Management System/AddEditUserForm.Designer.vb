<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class AddEditUserForm
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
        Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(AddEditUserForm))
        Label1 = New Label()
        Label2 = New Label()
        Label3 = New Label()
        txtUsername = New TextBox()
        txtPassword = New TextBox()
        cmbRole = New ComboBox()
        lblPasswordHint = New Label()
        btnSave = New Button()
        btnCancel = New Button()
        SuspendLayout()
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Location = New Point(20, 20)
        Label1.Name = "Label1"
        Label1.Size = New Size(78, 20)
        Label1.TabIndex = 0
        Label1.Text = "Username:"
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.Location = New Point(20, 50)
        Label2.Name = "Label2"
        Label2.Size = New Size(73, 20)
        Label2.TabIndex = 1
        Label2.Text = "Password:"
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.Location = New Point(20, 100)
        Label3.Name = "Label3"
        Label3.Size = New Size(42, 20)
        Label3.TabIndex = 2
        Label3.Text = "Role:"
        ' 
        ' txtUsername
        ' 
        txtUsername.Location = New Point(120, 20)
        txtUsername.Name = "txtUsername"
        txtUsername.Size = New Size(200, 27)
        txtUsername.TabIndex = 3
        ' 
        ' txtPassword
        ' 
        txtPassword.Location = New Point(120, 50)
        txtPassword.Name = "txtPassword"
        txtPassword.Size = New Size(200, 27)
        txtPassword.TabIndex = 4
        txtPassword.UseSystemPasswordChar = True
        ' 
        ' cmbRole
        ' 
        cmbRole.DropDownStyle = ComboBoxStyle.DropDownList
        cmbRole.FormattingEnabled = True
        cmbRole.Location = New Point(120, 100)
        cmbRole.Name = "cmbRole"
        cmbRole.Size = New Size(200, 28)
        cmbRole.TabIndex = 5
        ' 
        ' lblPasswordHint
        ' 
        lblPasswordHint.AutoSize = True
        lblPasswordHint.ForeColor = Color.Gray
        lblPasswordHint.Location = New Point(52, 80)
        lblPasswordHint.Name = "lblPasswordHint"
        lblPasswordHint.Size = New Size(268, 20)
        lblPasswordHint.TabIndex = 6
        lblPasswordHint.Text = "(Leave blank to keep current password)"
        ' 
        ' btnSave
        ' 
        btnSave.Location = New Point(120, 150)
        btnSave.Name = "btnSave"
        btnSave.Size = New Size(80, 30)
        btnSave.TabIndex = 7
        btnSave.Text = "Save"
        btnSave.UseVisualStyleBackColor = True
        ' 
        ' btnCancel
        ' 
        btnCancel.Location = New Point(220, 150)
        btnCancel.Name = "btnCancel"
        btnCancel.Size = New Size(80, 30)
        btnCancel.TabIndex = 8
        btnCancel.Text = "Cancel"
        btnCancel.UseVisualStyleBackColor = True
        ' 
        ' AddEditUserForm
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        ClientSize = New Size(332, 203)
        Controls.Add(btnCancel)
        Controls.Add(btnSave)
        Controls.Add(lblPasswordHint)
        Controls.Add(cmbRole)
        Controls.Add(txtPassword)
        Controls.Add(txtUsername)
        Controls.Add(Label3)
        Controls.Add(Label2)
        Controls.Add(Label1)
        FormBorderStyle = FormBorderStyle.FixedDialog
        Icon = CType(resources.GetObject("$this.Icon"), Icon)
        MaximizeBox = False
        MinimizeBox = False
        Name = "AddEditUserForm"
        StartPosition = FormStartPosition.CenterParent
        Text = "AddEditUserForm"
        ResumeLayout(False)
        PerformLayout()
    End Sub

    Friend WithEvents Label1 As Label
    Friend WithEvents Label2 As Label
    Friend WithEvents Label3 As Label
    Friend WithEvents txtUsername As TextBox
    Friend WithEvents txtPassword As TextBox
    Friend WithEvents cmbRole As ComboBox
    Friend WithEvents lblPasswordHint As Label
    Friend WithEvents btnSave As Button
    Friend WithEvents btnCancel As Button
End Class
