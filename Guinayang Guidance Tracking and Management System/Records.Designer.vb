<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class Records
    Inherits System.Windows.Forms.UserControl

    'UserControl overrides dispose to clean up the component list.
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
        components = New ComponentModel.Container()
        Dim DataGridViewCellStyle1 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle2 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle6 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle7 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle3 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle4 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle5 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Panel1 = New Panel()
        Panel10 = New Panel()
        PictureBox1 = New PictureBox()
        Label4 = New Label()
        Label1 = New Label()
        Panel2 = New Panel()
        Panel11 = New Panel()
        PictureBox2 = New PictureBox()
        Label5 = New Label()
        Label2 = New Label()
        Panel3 = New Panel()
        Panel12 = New Panel()
        PictureBox3 = New PictureBox()
        Label6 = New Label()
        Label3 = New Label()
        DataGridView1 = New DataGridView()
        LRN = New DataGridViewTextBoxColumn()
        FullName = New DataGridViewTextBoxColumn()
        Age = New DataGridViewTextBoxColumn()
        ContactNumber = New DataGridViewTextBoxColumn()
        Email = New DataGridViewTextBoxColumn()
        MiddleInitial = New DataGridViewTextBoxColumn()
        Surname = New DataGridViewTextBoxColumn()
        FirstName = New DataGridViewTextBoxColumn()
        ActionsSR = New DataGridViewTextBoxColumn()
        Panel4 = New Panel()
        TextBox1 = New TextBox()
        Panel5 = New Panel()
        Button1 = New Button()
        TableLayoutPanel1 = New TableLayoutPanel()
        Panel8 = New Panel()
        Panel9 = New Panel()
        Label7 = New Label()
        Timer1 = New Timer(components)
        Panel6 = New Panel()
        Button2 = New Button()
        Panel1.SuspendLayout()
        Panel10.SuspendLayout()
        CType(PictureBox1, ComponentModel.ISupportInitialize).BeginInit()
        Panel2.SuspendLayout()
        Panel11.SuspendLayout()
        CType(PictureBox2, ComponentModel.ISupportInitialize).BeginInit()
        Panel3.SuspendLayout()
        Panel12.SuspendLayout()
        CType(PictureBox3, ComponentModel.ISupportInitialize).BeginInit()
        CType(DataGridView1, ComponentModel.ISupportInitialize).BeginInit()
        Panel4.SuspendLayout()
        Panel5.SuspendLayout()
        TableLayoutPanel1.SuspendLayout()
        Panel8.SuspendLayout()
        Panel9.SuspendLayout()
        Panel6.SuspendLayout()
        SuspendLayout()
        ' 
        ' Panel1
        ' 
        Panel1.BackColor = Color.White
        Panel1.Controls.Add(Panel10)
        Panel1.Controls.Add(Label4)
        Panel1.Controls.Add(Label1)
        Panel1.Dock = DockStyle.Fill
        Panel1.Location = New Point(9, 12)
        Panel1.Name = "Panel1"
        Panel1.Size = New Size(319, 156)
        Panel1.TabIndex = 0
        ' 
        ' Panel10
        ' 
        Panel10.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel10.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel10.Controls.Add(PictureBox1)
        Panel10.Location = New Point(241, 11)
        Panel10.Name = "Panel10"
        Panel10.Size = New Size(60, 60)
        Panel10.TabIndex = 4
        ' 
        ' PictureBox1
        ' 
        PictureBox1.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox1.Image = My.Resources.Resources.users_solid
        PictureBox1.Location = New Point(10, 10)
        PictureBox1.Name = "PictureBox1"
        PictureBox1.Padding = New Padding(2)
        PictureBox1.Size = New Size(40, 40)
        PictureBox1.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox1.TabIndex = 2
        PictureBox1.TabStop = False
        ' 
        ' Label4
        ' 
        Label4.AutoSize = True
        Label4.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label4.ForeColor = Color.Firebrick
        Label4.Location = New Point(31, 88)
        Label4.Name = "Label4"
        Label4.Size = New Size(33, 38)
        Label4.TabIndex = 1
        Label4.Text = "0"
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label1.Location = New Point(31, 24)
        Label1.Name = "Label1"
        Label1.Size = New Size(148, 28)
        Label1.TabIndex = 0
        Label1.Text = "Total Students"
        ' 
        ' Panel2
        ' 
        Panel2.BackColor = Color.White
        Panel2.Controls.Add(Panel11)
        Panel2.Controls.Add(Label5)
        Panel2.Controls.Add(Label2)
        Panel2.Dock = DockStyle.Fill
        Panel2.Location = New Point(339, 12)
        Panel2.Name = "Panel2"
        Panel2.Size = New Size(319, 156)
        Panel2.TabIndex = 1
        ' 
        ' Panel11
        ' 
        Panel11.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel11.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel11.Controls.Add(PictureBox2)
        Panel11.Location = New Point(242, 11)
        Panel11.Name = "Panel11"
        Panel11.Size = New Size(60, 60)
        Panel11.TabIndex = 5
        ' 
        ' PictureBox2
        ' 
        PictureBox2.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox2.Image = My.Resources.Resources.triangle_exclamation_solid
        PictureBox2.Location = New Point(10, 10)
        PictureBox2.Name = "PictureBox2"
        PictureBox2.Padding = New Padding(2)
        PictureBox2.Size = New Size(40, 40)
        PictureBox2.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox2.TabIndex = 2
        PictureBox2.TabStop = False
        ' 
        ' Label5
        ' 
        Label5.AutoSize = True
        Label5.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label5.ForeColor = Color.Firebrick
        Label5.Location = New Point(25, 88)
        Label5.Name = "Label5"
        Label5.Size = New Size(33, 38)
        Label5.TabIndex = 2
        Label5.Text = "0"
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label2.Location = New Point(25, 24)
        Label2.Name = "Label2"
        Label2.Size = New Size(201, 28)
        Label2.TabIndex = 1
        Label2.Text = "Students with Cases"
        ' 
        ' Panel3
        ' 
        Panel3.BackColor = Color.White
        Panel3.Controls.Add(Panel12)
        Panel3.Controls.Add(Label6)
        Panel3.Controls.Add(Label3)
        Panel3.Dock = DockStyle.Fill
        Panel3.Location = New Point(669, 12)
        Panel3.Name = "Panel3"
        Panel3.Size = New Size(319, 156)
        Panel3.TabIndex = 2
        ' 
        ' Panel12
        ' 
        Panel12.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel12.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel12.Controls.Add(PictureBox3)
        Panel12.Location = New Point(238, 11)
        Panel12.Name = "Panel12"
        Panel12.Size = New Size(60, 60)
        Panel12.TabIndex = 6
        ' 
        ' PictureBox3
        ' 
        PictureBox3.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox3.Image = My.Resources.Resources.circle_exclamation_solid
        PictureBox3.Location = New Point(10, 10)
        PictureBox3.Name = "PictureBox3"
        PictureBox3.Padding = New Padding(2)
        PictureBox3.Size = New Size(40, 40)
        PictureBox3.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox3.TabIndex = 2
        PictureBox3.TabStop = False
        ' 
        ' Label6
        ' 
        Label6.AutoSize = True
        Label6.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label6.ForeColor = Color.Firebrick
        Label6.Location = New Point(25, 88)
        Label6.Name = "Label6"
        Label6.Size = New Size(33, 38)
        Label6.TabIndex = 3
        Label6.Text = "0"
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label3.Location = New Point(25, 24)
        Label3.Name = "Label3"
        Label3.Size = New Size(117, 28)
        Label3.TabIndex = 2
        Label3.Text = "Total Cases"
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
        DataGridView1.BorderStyle = BorderStyle.None
        DataGridView1.CellBorderStyle = DataGridViewCellBorderStyle.None
        DataGridViewCellStyle2.Alignment = DataGridViewContentAlignment.MiddleCenter
        DataGridViewCellStyle2.Font = New Font("Segoe UI", 9F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        DataGridViewCellStyle2.ForeColor = Color.Black
        DataGridViewCellStyle2.WrapMode = DataGridViewTriState.True
        DataGridView1.ColumnHeadersDefaultCellStyle = DataGridViewCellStyle2
        DataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize
        DataGridView1.Columns.AddRange(New DataGridViewColumn() {LRN, FullName, Age, ContactNumber, Email, MiddleInitial, Surname, FirstName, ActionsSR})
        DataGridViewCellStyle6.Alignment = DataGridViewContentAlignment.MiddleLeft
        DataGridViewCellStyle6.BackColor = Color.White
        DataGridViewCellStyle6.Font = New Font("Segoe UI", 10.8F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        DataGridViewCellStyle6.ForeColor = Color.Black
        DataGridViewCellStyle6.Padding = New Padding(8)
        DataGridViewCellStyle6.SelectionBackColor = Color.Transparent
        DataGridViewCellStyle6.SelectionForeColor = Color.Black
        DataGridViewCellStyle6.WrapMode = DataGridViewTriState.False
        DataGridView1.DefaultCellStyle = DataGridViewCellStyle6
        DataGridView1.Dock = DockStyle.Fill
        DataGridView1.EnableHeadersVisualStyles = False
        DataGridView1.GridColor = Color.White
        DataGridView1.Location = New Point(0, 65)
        DataGridView1.MultiSelect = False
        DataGridView1.Name = "DataGridView1"
        DataGridView1.ReadOnly = True
        DataGridView1.RowHeadersVisible = False
        DataGridView1.RowHeadersWidth = 51
        DataGridViewCellStyle7.BackColor = Color.White
        DataGridViewCellStyle7.ForeColor = Color.Black
        DataGridViewCellStyle7.SelectionBackColor = Color.White
        DataGridViewCellStyle7.SelectionForeColor = Color.Black
        DataGridView1.RowsDefaultCellStyle = DataGridViewCellStyle7
        DataGridView1.RowTemplate.Height = 46
        DataGridView1.ScrollBars = ScrollBars.Vertical
        DataGridView1.SelectionMode = DataGridViewSelectionMode.FullRowSelect
        DataGridView1.ShowCellErrors = False
        DataGridView1.ShowCellToolTips = False
        DataGridView1.ShowEditingIcon = False
        DataGridView1.ShowRowErrors = False
        DataGridView1.Size = New Size(979, 666)
        DataGridView1.TabIndex = 3
        ' 
        ' LRN
        ' 
        LRN.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        DataGridViewCellStyle3.Alignment = DataGridViewContentAlignment.MiddleCenter
        LRN.DefaultCellStyle = DataGridViewCellStyle3
        LRN.FillWeight = 15F
        LRN.HeaderText = "LRN"
        LRN.MaxInputLength = 12
        LRN.MinimumWidth = 6
        LRN.Name = "LRN"
        LRN.ReadOnly = True
        LRN.Resizable = DataGridViewTriState.False
        ' 
        ' FullName
        ' 
        FullName.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        FullName.FillWeight = 30F
        FullName.HeaderText = "FULL NAME"
        FullName.MinimumWidth = 6
        FullName.Name = "FullName"
        FullName.ReadOnly = True
        FullName.Resizable = DataGridViewTriState.False
        ' 
        ' Age
        ' 
        Age.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        DataGridViewCellStyle4.Alignment = DataGridViewContentAlignment.MiddleCenter
        Age.DefaultCellStyle = DataGridViewCellStyle4
        Age.FillWeight = 8F
        Age.HeaderText = "AGE"
        Age.MinimumWidth = 6
        Age.Name = "Age"
        Age.ReadOnly = True
        Age.Resizable = DataGridViewTriState.False
        ' 
        ' ContactNumber
        ' 
        ContactNumber.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        DataGridViewCellStyle5.Alignment = DataGridViewContentAlignment.MiddleCenter
        ContactNumber.DefaultCellStyle = DataGridViewCellStyle5
        ContactNumber.FillWeight = 20F
        ContactNumber.HeaderText = "CONTACT NO."
        ContactNumber.MinimumWidth = 6
        ContactNumber.Name = "ContactNumber"
        ContactNumber.ReadOnly = True
        ContactNumber.Resizable = DataGridViewTriState.False
        ' 
        ' Email
        ' 
        Email.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        Email.FillWeight = 30F
        Email.HeaderText = "EMAIL"
        Email.MinimumWidth = 6
        Email.Name = "Email"
        Email.ReadOnly = True
        Email.Resizable = DataGridViewTriState.False
        ' 
        ' MiddleInitial
        ' 
        MiddleInitial.HeaderText = "Column1"
        MiddleInitial.MinimumWidth = 6
        MiddleInitial.Name = "MiddleInitial"
        MiddleInitial.ReadOnly = True
        MiddleInitial.Visible = False
        ' 
        ' Surname
        ' 
        Surname.HeaderText = "Column1"
        Surname.MinimumWidth = 6
        Surname.Name = "Surname"
        Surname.ReadOnly = True
        Surname.Visible = False
        ' 
        ' FirstName
        ' 
        FirstName.HeaderText = "Column1"
        FirstName.MinimumWidth = 6
        FirstName.Name = "FirstName"
        FirstName.ReadOnly = True
        FirstName.Visible = False
        ' 
        ' ActionsSR
        ' 
        ActionsSR.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        ActionsSR.FillWeight = 8F
        ActionsSR.HeaderText = "Actions"
        ActionsSR.MinimumWidth = 6
        ActionsSR.Name = "ActionsSR"
        ActionsSR.ReadOnly = True
        ActionsSR.Resizable = DataGridViewTriState.True
        ActionsSR.SortMode = DataGridViewColumnSortMode.NotSortable
        ' 
        ' Panel4
        ' 
        Panel4.BackColor = Color.White
        TableLayoutPanel1.SetColumnSpan(Panel4, 5)
        Panel4.Controls.Add(TextBox1)
        Panel4.Dock = DockStyle.Fill
        Panel4.Location = New Point(9, 928)
        Panel4.Name = "Panel4"
        Panel4.Size = New Size(979, 55)
        Panel4.TabIndex = 4
        ' 
        ' TextBox1
        ' 
        TextBox1.Anchor = AnchorStyles.Top Or AnchorStyles.Bottom Or AnchorStyles.Left
        TextBox1.BorderStyle = BorderStyle.None
        TextBox1.Font = New Font("Segoe UI", 12F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        TextBox1.ForeColor = Color.Black
        TextBox1.Location = New Point(6, 12)
        TextBox1.Name = "TextBox1"
        TextBox1.PlaceholderText = "Search by LRN, Full Name, or Email..."
        TextBox1.Size = New Size(965, 27)
        TextBox1.TabIndex = 0
        ' 
        ' Panel5
        ' 
        Panel5.Anchor = AnchorStyles.Right
        Panel5.BackColor = Color.PaleGreen
        Panel5.Controls.Add(Button1)
        Panel5.Location = New Point(851, 8)
        Panel5.Name = "Panel5"
        Panel5.Size = New Size(120, 50)
        Panel5.TabIndex = 5
        ' 
        ' Button1
        ' 
        Button1.BackColor = Color.PaleGreen
        Button1.Dock = DockStyle.Fill
        Button1.Location = New Point(0, 0)
        Button1.Name = "Button1"
        Button1.Size = New Size(120, 50)
        Button1.TabIndex = 0
        Button1.Text = "Add"
        Button1.UseVisualStyleBackColor = False
        ' 
        ' TableLayoutPanel1
        ' 
        TableLayoutPanel1.BackColor = Color.FromArgb(CByte(224), CByte(224), CByte(224))
        TableLayoutPanel1.ColumnCount = 7
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.6199691F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 32.53422F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.592455745F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 32.53422F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.592455745F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 32.53422F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.5924556F))
        TableLayoutPanel1.Controls.Add(Panel2, 3, 1)
        TableLayoutPanel1.Controls.Add(Panel1, 1, 1)
        TableLayoutPanel1.Controls.Add(Panel8, 1, 3)
        TableLayoutPanel1.Controls.Add(Panel4, 1, 5)
        TableLayoutPanel1.Controls.Add(Panel3, 5, 1)
        TableLayoutPanel1.Dock = DockStyle.Fill
        TableLayoutPanel1.Location = New Point(0, 0)
        TableLayoutPanel1.Name = "TableLayoutPanel1"
        TableLayoutPanel1.RowCount = 7
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.99199F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 16.2686253F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.8936923F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 73.70481F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.991989553F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 6.15598726F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 0.992901146F))
        TableLayoutPanel1.Size = New Size(1000, 1000)
        TableLayoutPanel1.TabIndex = 8
        ' 
        ' Panel8
        ' 
        Panel8.BackColor = Color.White
        TableLayoutPanel1.SetColumnSpan(Panel8, 5)
        Panel8.Controls.Add(DataGridView1)
        Panel8.Controls.Add(Panel9)
        Panel8.Dock = DockStyle.Fill
        Panel8.Location = New Point(9, 182)
        Panel8.Name = "Panel8"
        Panel8.Size = New Size(979, 731)
        Panel8.TabIndex = 3
        ' 
        ' Panel9
        ' 
        Panel9.Controls.Add(Panel6)
        Panel9.Controls.Add(Label7)
        Panel9.Controls.Add(Panel5)
        Panel9.Dock = DockStyle.Top
        Panel9.Location = New Point(0, 0)
        Panel9.Name = "Panel9"
        Panel9.Size = New Size(979, 65)
        Panel9.TabIndex = 0
        ' 
        ' Label7
        ' 
        Label7.AutoSize = True
        Label7.Font = New Font("Segoe UI", 18F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        Label7.Location = New Point(12, 10)
        Label7.Name = "Label7"
        Label7.Size = New Size(248, 41)
        Label7.TabIndex = 8
        Label7.Text = "Student Records"
        ' 
        ' Timer1
        ' 
        ' 
        ' Panel6
        ' 
        Panel6.Anchor = AnchorStyles.Right
        Panel6.BackColor = Color.PaleGreen
        Panel6.Controls.Add(Button2)
        Panel6.Location = New Point(725, 8)
        Panel6.Name = "Panel6"
        Panel6.Size = New Size(120, 50)
        Panel6.TabIndex = 6
        ' 
        ' Button2
        ' 
        Button2.BackColor = Color.LightSlateGray
        Button2.Dock = DockStyle.Fill
        Button2.Location = New Point(0, 0)
        Button2.Name = "Button2"
        Button2.Size = New Size(120, 50)
        Button2.TabIndex = 0
        Button2.Text = "Import"
        Button2.UseVisualStyleBackColor = False
        ' 
        ' Records
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        BackColor = Color.FromArgb(CByte(252), CByte(231), CByte(200))
        Controls.Add(TableLayoutPanel1)
        Name = "Records"
        Size = New Size(1000, 1000)
        Panel1.ResumeLayout(False)
        Panel1.PerformLayout()
        Panel10.ResumeLayout(False)
        CType(PictureBox1, ComponentModel.ISupportInitialize).EndInit()
        Panel2.ResumeLayout(False)
        Panel2.PerformLayout()
        Panel11.ResumeLayout(False)
        CType(PictureBox2, ComponentModel.ISupportInitialize).EndInit()
        Panel3.ResumeLayout(False)
        Panel3.PerformLayout()
        Panel12.ResumeLayout(False)
        CType(PictureBox3, ComponentModel.ISupportInitialize).EndInit()
        CType(DataGridView1, ComponentModel.ISupportInitialize).EndInit()
        Panel4.ResumeLayout(False)
        Panel4.PerformLayout()
        Panel5.ResumeLayout(False)
        TableLayoutPanel1.ResumeLayout(False)
        Panel8.ResumeLayout(False)
        Panel9.ResumeLayout(False)
        Panel9.PerformLayout()
        Panel6.ResumeLayout(False)
        ResumeLayout(False)
    End Sub

    Friend WithEvents Panel1 As Panel
    Friend WithEvents Panel2 As Panel
    Friend WithEvents Panel3 As Panel
    Friend WithEvents DataGridView1 As DataGridView
    Friend WithEvents Panel4 As Panel
    Friend WithEvents Panel5 As Panel
    Friend WithEvents Button1 As Button
    Friend WithEvents Label1 As Label
    Friend WithEvents Label2 As Label
    Friend WithEvents Label3 As Label
    Friend WithEvents Label4 As Label
    Friend WithEvents Label5 As Label
    Friend WithEvents Label6 As Label
    Friend WithEvents TableLayoutPanel1 As TableLayoutPanel
    Friend WithEvents Panel8 As Panel
    Friend WithEvents Panel9 As Panel
    Friend WithEvents Label7 As Label
    Friend WithEvents TextBox1 As TextBox
    Friend WithEvents Timer1 As Timer
    Friend WithEvents Panel10 As Panel
    Friend WithEvents PictureBox1 As PictureBox
    Friend WithEvents Panel11 As Panel
    Friend WithEvents PictureBox2 As PictureBox
    Friend WithEvents Panel12 As Panel
    Friend WithEvents PictureBox3 As PictureBox
    Friend WithEvents LRN As DataGridViewTextBoxColumn
    Friend WithEvents FullName As DataGridViewTextBoxColumn
    Friend WithEvents Age As DataGridViewTextBoxColumn
    Friend WithEvents ContactNumber As DataGridViewTextBoxColumn
    Friend WithEvents Email As DataGridViewTextBoxColumn
    Friend WithEvents MiddleInitial As DataGridViewTextBoxColumn
    Friend WithEvents Surname As DataGridViewTextBoxColumn
    Friend WithEvents FirstName As DataGridViewTextBoxColumn
    Friend WithEvents ActionsSR As DataGridViewTextBoxColumn
    Friend WithEvents Panel6 As Panel
    Friend WithEvents Button2 As Button

End Class
