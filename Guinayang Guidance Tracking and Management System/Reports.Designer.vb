<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class Reports
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
        Dim DataGridViewCellStyle1 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle2 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle3 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Dim DataGridViewCellStyle4 As DataGridViewCellStyle = New DataGridViewCellStyle()
        Panel4 = New Panel()
        TextBox1 = New TextBox()
        Panel3 = New Panel()
        Panel11 = New Panel()
        PictureBox4 = New PictureBox()
        Label6 = New Label()
        Label3 = New Label()
        Panel2 = New Panel()
        Panel7 = New Panel()
        PictureBox3 = New PictureBox()
        Label9 = New Label()
        Label8 = New Label()
        Label5 = New Label()
        Label2 = New Label()
        Panel1 = New Panel()
        Panel6 = New Panel()
        PictureBox2 = New PictureBox()
        Label4 = New Label()
        Label1 = New Label()
        TableLayoutPanel1 = New TableLayoutPanel()
        Panel5 = New Panel()
        DataGridView1 = New DataGridView()
        ownerId = New DataGridViewTextBoxColumn()
        incidentType = New DataGridViewTextBoxColumn()
        timestamp = New DataGridViewTextBoxColumn()
        status = New DataGridViewTextBoxColumn()
        urgencyLevel = New DataGridViewTextBoxColumn()
        ActionsR = New DataGridViewTextBoxColumn()
        Panel8 = New Panel()
        Label7 = New Label()
        Panel9 = New Panel()
        Panel10 = New Panel()
        PictureBox1 = New PictureBox()
        Panel4.SuspendLayout()
        Panel3.SuspendLayout()
        Panel11.SuspendLayout()
        CType(PictureBox4, ComponentModel.ISupportInitialize).BeginInit()
        Panel2.SuspendLayout()
        Panel7.SuspendLayout()
        CType(PictureBox3, ComponentModel.ISupportInitialize).BeginInit()
        Panel1.SuspendLayout()
        Panel6.SuspendLayout()
        CType(PictureBox2, ComponentModel.ISupportInitialize).BeginInit()
        TableLayoutPanel1.SuspendLayout()
        Panel5.SuspendLayout()
        CType(DataGridView1, ComponentModel.ISupportInitialize).BeginInit()
        Panel8.SuspendLayout()
        Panel9.SuspendLayout()
        Panel10.SuspendLayout()
        CType(PictureBox1, ComponentModel.ISupportInitialize).BeginInit()
        SuspendLayout()
        ' 
        ' Panel4
        ' 
        Panel4.BackColor = Color.White
        TableLayoutPanel1.SetColumnSpan(Panel4, 7)
        Panel4.Controls.Add(TextBox1)
        Panel4.Dock = DockStyle.Fill
        Panel4.Location = New Point(7, 931)
        Panel4.Name = "Panel4"
        Panel4.Size = New Size(978, 54)
        Panel4.TabIndex = 12
        ' 
        ' TextBox1
        ' 
        TextBox1.BackColor = Color.White
        TextBox1.BorderStyle = BorderStyle.None
        TextBox1.Font = New Font("Segoe UI", 12F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        TextBox1.Location = New Point(3, 11)
        TextBox1.Name = "TextBox1"
        TextBox1.PlaceholderText = "Type to search..."
        TextBox1.Size = New Size(970, 27)
        TextBox1.TabIndex = 0
        TextBox1.WordWrap = False
        ' 
        ' Panel3
        ' 
        Panel3.BackColor = Color.White
        Panel3.Controls.Add(Panel11)
        Panel3.Controls.Add(Label6)
        Panel3.Controls.Add(Label3)
        Panel3.Dock = DockStyle.Fill
        Panel3.Location = New Point(748, 13)
        Panel3.Name = "Panel3"
        Panel3.Size = New Size(237, 155)
        Panel3.TabIndex = 10
        ' 
        ' Panel11
        ' 
        Panel11.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel11.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel11.Controls.Add(PictureBox4)
        Panel11.Location = New Point(163, 12)
        Panel11.Name = "Panel11"
        Panel11.Size = New Size(60, 60)
        Panel11.TabIndex = 6
        ' 
        ' PictureBox4
        ' 
        PictureBox4.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox4.Image = My.Resources.Resources.circle_check_solid
        PictureBox4.Location = New Point(10, 10)
        PictureBox4.Name = "PictureBox4"
        PictureBox4.Padding = New Padding(2)
        PictureBox4.Size = New Size(40, 40)
        PictureBox4.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox4.TabIndex = 2
        PictureBox4.TabStop = False
        ' 
        ' Label6
        ' 
        Label6.AutoSize = True
        Label6.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label6.ForeColor = Color.Firebrick
        Label6.Location = New Point(27, 91)
        Label6.Name = "Label6"
        Label6.Size = New Size(33, 38)
        Label6.TabIndex = 3
        Label6.Text = "0"
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label3.Location = New Point(27, 26)
        Label3.Name = "Label3"
        Label3.Size = New Size(97, 28)
        Label3.TabIndex = 2
        Label3.Text = "Resolved"
        ' 
        ' Panel2
        ' 
        Panel2.BackColor = Color.White
        Panel2.Controls.Add(Panel7)
        Panel2.Controls.Add(Label9)
        Panel2.Controls.Add(Label8)
        Panel2.Dock = DockStyle.Fill
        Panel2.Location = New Point(501, 13)
        Panel2.Name = "Panel2"
        Panel2.Size = New Size(237, 155)
        Panel2.TabIndex = 9
        ' 
        ' Panel7
        ' 
        Panel7.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel7.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel7.Controls.Add(PictureBox3)
        Panel7.Location = New Point(165, 12)
        Panel7.Name = "Panel7"
        Panel7.Size = New Size(60, 60)
        Panel7.TabIndex = 6
        ' 
        ' PictureBox3
        ' 
        PictureBox3.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox3.Image = My.Resources.Resources.clock_solid
        PictureBox3.Location = New Point(10, 10)
        PictureBox3.Name = "PictureBox3"
        PictureBox3.Padding = New Padding(2)
        PictureBox3.Size = New Size(40, 40)
        PictureBox3.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox3.TabIndex = 2
        PictureBox3.TabStop = False
        ' 
        ' Label9
        ' 
        Label9.AutoSize = True
        Label9.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label9.ForeColor = Color.Firebrick
        Label9.Location = New Point(25, 91)
        Label9.Name = "Label9"
        Label9.Size = New Size(33, 38)
        Label9.TabIndex = 1
        Label9.Text = "0"
        ' 
        ' Label8
        ' 
        Label8.AutoSize = True
        Label8.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label8.Location = New Point(25, 26)
        Label8.Name = "Label8"
        Label8.Size = New Size(118, 28)
        Label8.TabIndex = 0
        Label8.Text = "On-Process"
        ' 
        ' Label5
        ' 
        Label5.AutoSize = True
        Label5.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label5.ForeColor = Color.Firebrick
        Label5.Location = New Point(33, 91)
        Label5.Name = "Label5"
        Label5.Size = New Size(33, 38)
        Label5.TabIndex = 2
        Label5.Text = "0"
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label2.Location = New Point(33, 26)
        Label2.Name = "Label2"
        Label2.Size = New Size(80, 28)
        Label2.TabIndex = 1
        Label2.Text = "Unread"
        ' 
        ' Panel1
        ' 
        Panel1.BackColor = Color.White
        Panel1.Controls.Add(Panel6)
        Panel1.Controls.Add(Label5)
        Panel1.Controls.Add(Label2)
        Panel1.Dock = DockStyle.Fill
        Panel1.Location = New Point(254, 13)
        Panel1.Name = "Panel1"
        Panel1.Size = New Size(237, 155)
        Panel1.TabIndex = 8
        ' 
        ' Panel6
        ' 
        Panel6.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel6.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel6.Controls.Add(PictureBox2)
        Panel6.Location = New Point(164, 12)
        Panel6.Name = "Panel6"
        Panel6.Size = New Size(60, 60)
        Panel6.TabIndex = 6
        ' 
        ' PictureBox2
        ' 
        PictureBox2.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox2.Image = My.Resources.Resources.envelope_solid
        PictureBox2.Location = New Point(10, 10)
        PictureBox2.Name = "PictureBox2"
        PictureBox2.Padding = New Padding(2)
        PictureBox2.Size = New Size(40, 40)
        PictureBox2.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox2.TabIndex = 2
        PictureBox2.TabStop = False
        ' 
        ' Label4
        ' 
        Label4.AutoSize = True
        Label4.Font = New Font("Segoe UI", 16.2F, FontStyle.Bold)
        Label4.ForeColor = Color.Firebrick
        Label4.Location = New Point(24, 92)
        Label4.Name = "Label4"
        Label4.Size = New Size(33, 38)
        Label4.TabIndex = 1
        Label4.Text = "0"
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Font = New Font("Segoe UI", 12F, FontStyle.Bold)
        Label1.Location = New Point(24, 27)
        Label1.Name = "Label1"
        Label1.Size = New Size(139, 28)
        Label1.TabIndex = 0
        Label1.Text = "Total Reports"
        ' 
        ' TableLayoutPanel1
        ' 
        TableLayoutPanel1.BackColor = Color.FromArgb(CByte(224), CByte(224), CByte(224))
        TableLayoutPanel1.ColumnCount = 9
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.4975124F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 24.378109F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.49751243F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 24.378109F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.49751243F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 24.378109F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.49751243F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 24.378109F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 0.49751243F))
        TableLayoutPanel1.Controls.Add(Panel3, 7, 1)
        TableLayoutPanel1.Controls.Add(Panel2, 5, 1)
        TableLayoutPanel1.Controls.Add(Panel4, 1, 5)
        TableLayoutPanel1.Controls.Add(Panel1, 3, 1)
        TableLayoutPanel1.Controls.Add(Panel5, 1, 3)
        TableLayoutPanel1.Controls.Add(Panel9, 1, 1)
        TableLayoutPanel1.Dock = DockStyle.Fill
        TableLayoutPanel1.Location = New Point(0, 0)
        TableLayoutPanel1.Name = "TableLayoutPanel1"
        TableLayoutPanel1.RowCount = 7
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 1.010101F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 16.1616154F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 1.010101F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 73.73737F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 1.010101F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 6.060606F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 1.010101F))
        TableLayoutPanel1.Size = New Size(1000, 1000)
        TableLayoutPanel1.TabIndex = 17
        ' 
        ' Panel5
        ' 
        TableLayoutPanel1.SetColumnSpan(Panel5, 7)
        Panel5.Controls.Add(DataGridView1)
        Panel5.Controls.Add(Panel8)
        Panel5.Dock = DockStyle.Fill
        Panel5.Location = New Point(7, 184)
        Panel5.Name = "Panel5"
        Panel5.Size = New Size(978, 731)
        Panel5.TabIndex = 17
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
        DataGridViewCellStyle2.Padding = New Padding(8)
        DataGridViewCellStyle2.WrapMode = DataGridViewTriState.True
        DataGridView1.ColumnHeadersDefaultCellStyle = DataGridViewCellStyle2
        DataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize
        DataGridView1.Columns.AddRange(New DataGridViewColumn() {ownerId, incidentType, timestamp, status, urgencyLevel, ActionsR})
        DataGridViewCellStyle3.Alignment = DataGridViewContentAlignment.MiddleCenter
        DataGridViewCellStyle3.BackColor = Color.White
        DataGridViewCellStyle3.Font = New Font("Segoe UI", 10.2F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        DataGridViewCellStyle3.ForeColor = Color.Black
        DataGridViewCellStyle3.SelectionBackColor = Color.Transparent
        DataGridViewCellStyle3.SelectionForeColor = Color.Black
        DataGridViewCellStyle3.WrapMode = DataGridViewTriState.False
        DataGridView1.DefaultCellStyle = DataGridViewCellStyle3
        DataGridView1.Dock = DockStyle.Fill
        DataGridView1.EnableHeadersVisualStyles = False
        DataGridView1.GridColor = Color.White
        DataGridView1.Location = New Point(0, 65)
        DataGridView1.MultiSelect = False
        DataGridView1.Name = "DataGridView1"
        DataGridView1.ReadOnly = True
        DataGridView1.RowHeadersVisible = False
        DataGridView1.RowHeadersWidth = 51
        DataGridViewCellStyle4.BackColor = Color.White
        DataGridViewCellStyle4.ForeColor = Color.Black
        DataGridViewCellStyle4.SelectionBackColor = Color.White
        DataGridViewCellStyle4.SelectionForeColor = Color.Black
        DataGridView1.RowsDefaultCellStyle = DataGridViewCellStyle4
        DataGridView1.RowTemplate.Height = 46
        DataGridView1.RowTemplate.ReadOnly = True
        DataGridView1.RowTemplate.Resizable = DataGridViewTriState.False
        DataGridView1.SelectionMode = DataGridViewSelectionMode.FullRowSelect
        DataGridView1.ShowCellErrors = False
        DataGridView1.ShowCellToolTips = False
        DataGridView1.ShowEditingIcon = False
        DataGridView1.ShowRowErrors = False
        DataGridView1.Size = New Size(978, 666)
        DataGridView1.TabIndex = 16
        ' 
        ' ownerId
        ' 
        ownerId.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        ownerId.DataPropertyName = "ownerId"
        ownerId.FillWeight = 20F
        ownerId.HeaderText = "Reports"
        ownerId.MinimumWidth = 6
        ownerId.Name = "ownerId"
        ownerId.ReadOnly = True
        ' 
        ' incidentType
        ' 
        incidentType.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        incidentType.DataPropertyName = "IncidentType"
        incidentType.FillWeight = 10F
        incidentType.HeaderText = "Incident Type"
        incidentType.MinimumWidth = 6
        incidentType.Name = "incidentType"
        incidentType.ReadOnly = True
        ' 
        ' timestamp
        ' 
        timestamp.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        timestamp.DataPropertyName = "timestamp"
        timestamp.FillWeight = 20F
        timestamp.HeaderText = "Timestamp"
        timestamp.MinimumWidth = 6
        timestamp.Name = "timestamp"
        timestamp.ReadOnly = True
        ' 
        ' status
        ' 
        status.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        status.DataPropertyName = "status"
        status.FillWeight = 10F
        status.HeaderText = "Status"
        status.MinimumWidth = 6
        status.Name = "status"
        status.ReadOnly = True
        ' 
        ' urgencyLevel
        ' 
        urgencyLevel.AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill
        urgencyLevel.DataPropertyName = "UrgencyLevel"
        urgencyLevel.FillWeight = 15F
        urgencyLevel.HeaderText = "Urgency Level"
        urgencyLevel.MinimumWidth = 6
        urgencyLevel.Name = "urgencyLevel"
        urgencyLevel.ReadOnly = True
        ' 
        ' ActionsR
        ' 
        ActionsR.FillWeight = 5F
        ActionsR.HeaderText = "Actions"
        ActionsR.MinimumWidth = 6
        ActionsR.Name = "ActionsR"
        ActionsR.ReadOnly = True
        ' 
        ' Panel8
        ' 
        Panel8.BackColor = Color.White
        Panel8.Controls.Add(Label7)
        Panel8.Dock = DockStyle.Top
        Panel8.Location = New Point(0, 0)
        Panel8.Name = "Panel8"
        Panel8.Size = New Size(978, 65)
        Panel8.TabIndex = 17
        ' 
        ' Label7
        ' 
        Label7.AutoSize = True
        Label7.Font = New Font("Segoe UI", 18F, FontStyle.Bold)
        Label7.Location = New Point(13, 13)
        Label7.Name = "Label7"
        Label7.Size = New Size(175, 41)
        Label7.TabIndex = 17
        Label7.Text = "All Reports"
        ' 
        ' Panel9
        ' 
        Panel9.BackColor = Color.White
        Panel9.Controls.Add(Panel10)
        Panel9.Controls.Add(Label4)
        Panel9.Controls.Add(Label1)
        Panel9.Dock = DockStyle.Fill
        Panel9.Location = New Point(7, 13)
        Panel9.Name = "Panel9"
        Panel9.Size = New Size(237, 155)
        Panel9.TabIndex = 18
        ' 
        ' Panel10
        ' 
        Panel10.Anchor = AnchorStyles.Top Or AnchorStyles.Right
        Panel10.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        Panel10.Controls.Add(PictureBox1)
        Panel10.Location = New Point(166, 13)
        Panel10.Name = "Panel10"
        Panel10.Size = New Size(60, 60)
        Panel10.TabIndex = 5
        ' 
        ' PictureBox1
        ' 
        PictureBox1.BackColor = Color.FromArgb(CByte(255), CByte(255), CByte(128))
        PictureBox1.Image = My.Resources.Resources.file_solid__1_
        PictureBox1.Location = New Point(10, 10)
        PictureBox1.Name = "PictureBox1"
        PictureBox1.Padding = New Padding(2)
        PictureBox1.Size = New Size(40, 40)
        PictureBox1.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox1.TabIndex = 2
        PictureBox1.TabStop = False
        ' 
        ' Reports
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        BackColor = Color.White
        Controls.Add(TableLayoutPanel1)
        Name = "Reports"
        Size = New Size(1000, 1000)
        Panel4.ResumeLayout(False)
        Panel4.PerformLayout()
        Panel3.ResumeLayout(False)
        Panel3.PerformLayout()
        Panel11.ResumeLayout(False)
        CType(PictureBox4, ComponentModel.ISupportInitialize).EndInit()
        Panel2.ResumeLayout(False)
        Panel2.PerformLayout()
        Panel7.ResumeLayout(False)
        CType(PictureBox3, ComponentModel.ISupportInitialize).EndInit()
        Panel1.ResumeLayout(False)
        Panel1.PerformLayout()
        Panel6.ResumeLayout(False)
        CType(PictureBox2, ComponentModel.ISupportInitialize).EndInit()
        TableLayoutPanel1.ResumeLayout(False)
        Panel5.ResumeLayout(False)
        CType(DataGridView1, ComponentModel.ISupportInitialize).EndInit()
        Panel8.ResumeLayout(False)
        Panel8.PerformLayout()
        Panel9.ResumeLayout(False)
        Panel9.PerformLayout()
        Panel10.ResumeLayout(False)
        CType(PictureBox1, ComponentModel.ISupportInitialize).EndInit()
        ResumeLayout(False)
    End Sub
    Friend WithEvents Panel4 As Panel
    Friend WithEvents TextBox1 As TextBox
    Friend WithEvents Panel3 As Panel
    Friend WithEvents Label6 As Label
    Friend WithEvents Label3 As Label
    Friend WithEvents Panel2 As Panel
    Friend WithEvents Label5 As Label
    Friend WithEvents Label2 As Label
    Friend WithEvents Panel1 As Panel
    Friend WithEvents Label4 As Label
    Friend WithEvents Label1 As Label
    Friend WithEvents TableLayoutPanel1 As TableLayoutPanel
    Friend WithEvents Panel5 As Panel
    Friend WithEvents DataGridView1 As DataGridView
    Friend WithEvents Panel8 As Panel
    Friend WithEvents Label7 As Label
    Friend WithEvents Label9 As Label
    Friend WithEvents Label8 As Label
    Friend WithEvents Panel9 As Panel
    Friend WithEvents ownerId As DataGridViewTextBoxColumn
    Friend WithEvents incidentType As DataGridViewTextBoxColumn
    Friend WithEvents timestamp As DataGridViewTextBoxColumn
    Friend WithEvents status As DataGridViewTextBoxColumn
    Friend WithEvents urgencyLevel As DataGridViewTextBoxColumn
    Friend WithEvents ActionsR As DataGridViewTextBoxColumn
    Friend WithEvents Panel11 As Panel
    Friend WithEvents PictureBox4 As PictureBox
    Friend WithEvents Panel7 As Panel
    Friend WithEvents PictureBox3 As PictureBox
    Friend WithEvents Panel6 As Panel
    Friend WithEvents PictureBox2 As PictureBox
    Friend WithEvents Panel10 As Panel
    Friend WithEvents PictureBox1 As PictureBox

End Class
