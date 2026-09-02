<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class LoginForm
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
        components = New ComponentModel.Container()
        Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(LoginForm))
        Label1 = New Label()
        Label2 = New Label()
        TextBox1 = New TextBox()
        TextBox2 = New TextBox()
        Panel1 = New Panel()
        PictureBox1 = New PictureBox()
        Panel2 = New Panel()
        PictureBox2 = New PictureBox()
        Panel3 = New Panel()
        Label5 = New Label()
        Label4 = New Label()
        PictureBox4 = New PictureBox()
        PictureBox3 = New PictureBox()
        LinkLabel1 = New LinkLabel()
        Panel4 = New Panel()
        hoverTimer = New Timer(components)
        Label3 = New Label()
        Timer1 = New Timer(components)
        Panel1.SuspendLayout()
        CType(PictureBox1, ComponentModel.ISupportInitialize).BeginInit()
        Panel2.SuspendLayout()
        CType(PictureBox2, ComponentModel.ISupportInitialize).BeginInit()
        Panel3.SuspendLayout()
        CType(PictureBox4, ComponentModel.ISupportInitialize).BeginInit()
        CType(PictureBox3, ComponentModel.ISupportInitialize).BeginInit()
        SuspendLayout()
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.BackColor = Color.White
        Label1.Font = New Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        Label1.ForeColor = Color.Black
        Label1.Location = New Point(40, 261)
        Label1.Name = "Label1"
        Label1.Size = New Size(106, 28)
        Label1.TabIndex = 0
        Label1.Text = "Username"
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.BackColor = Color.White
        Label2.Font = New Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        Label2.ForeColor = Color.Black
        Label2.Location = New Point(40, 380)
        Label2.Name = "Label2"
        Label2.Size = New Size(101, 28)
        Label2.TabIndex = 1
        Label2.Text = "Password"
        ' 
        ' TextBox1
        ' 
        TextBox1.Anchor = AnchorStyles.None
        TextBox1.BorderStyle = BorderStyle.None
        TextBox1.Font = New Font("Segoe UI", 10.2F, FontStyle.Regular, GraphicsUnit.Point, CByte(0))
        TextBox1.Location = New Point(12, 11)
        TextBox1.MaxLength = 16
        TextBox1.Name = "TextBox1"
        TextBox1.PlaceholderText = "Enter your username"
        TextBox1.Size = New Size(446, 23)
        TextBox1.TabIndex = 2
        ' 
        ' TextBox2
        ' 
        TextBox2.BorderStyle = BorderStyle.None
        TextBox2.CausesValidation = False
        TextBox2.Location = New Point(12, 11)
        TextBox2.MaxLength = 16
        TextBox2.Name = "TextBox2"
        TextBox2.PlaceholderText = "Enter your password"
        TextBox2.Size = New Size(446, 20)
        TextBox2.TabIndex = 3
        TextBox2.UseSystemPasswordChar = True
        ' 
        ' Panel1
        ' 
        Panel1.CausesValidation = False
        Panel1.Controls.Add(PictureBox1)
        Panel1.Controls.Add(TextBox1)
        Panel1.Location = New Point(40, 292)
        Panel1.Name = "Panel1"
        Panel1.Size = New Size(499, 46)
        Panel1.TabIndex = 4
        ' 
        ' PictureBox1
        ' 
        PictureBox1.Image = My.Resources.Resources.user_solid_full
        PictureBox1.Location = New Point(456, 3)
        PictureBox1.Name = "PictureBox1"
        PictureBox1.Size = New Size(40, 40)
        PictureBox1.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox1.TabIndex = 4
        PictureBox1.TabStop = False
        ' 
        ' Panel2
        ' 
        Panel2.Controls.Add(PictureBox2)
        Panel2.Controls.Add(TextBox2)
        Panel2.Location = New Point(40, 411)
        Panel2.Name = "Panel2"
        Panel2.Size = New Size(499, 46)
        Panel2.TabIndex = 5
        ' 
        ' PictureBox2
        ' 
        PictureBox2.Image = My.Resources.Resources.eye_solid_full
        PictureBox2.Location = New Point(456, 3)
        PictureBox2.Name = "PictureBox2"
        PictureBox2.Size = New Size(40, 40)
        PictureBox2.SizeMode = PictureBoxSizeMode.Zoom
        PictureBox2.TabIndex = 5
        PictureBox2.TabStop = False
        ' 
        ' Panel3
        ' 
        Panel3.BackColor = Color.Coral
        Panel3.Controls.Add(Label5)
        Panel3.Controls.Add(Label4)
        Panel3.Controls.Add(PictureBox4)
        Panel3.Controls.Add(PictureBox3)
        Panel3.Location = New Point(5, 5)
        Panel3.Name = "Panel3"
        Panel3.Size = New Size(573, 179)
        Panel3.TabIndex = 6
        ' 
        ' Label5
        ' 
        Label5.AutoSize = True
        Label5.Font = New Font("Segoe UI", 10.2F, FontStyle.Italic, GraphicsUnit.Point, CByte(0))
        Label5.Location = New Point(123, 90)
        Label5.Name = "Label5"
        Label5.Size = New Size(326, 23)
        Label5.TabIndex = 3
        Label5.Text = "Records Tracking and Management System"
        ' 
        ' Label4
        ' 
        Label4.AutoSize = True
        Label4.Font = New Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, CByte(0))
        Label4.Location = New Point(25, 61)
        Label4.Name = "Label4"
        Label4.Size = New Size(536, 28)
        Label4.TabIndex = 2
        Label4.Text = "Guinayang National High School Guidance Department"
        ' 
        ' PictureBox4
        ' 
        PictureBox4.BackColor = Color.Yellow
        PictureBox4.BorderStyle = BorderStyle.FixedSingle
        PictureBox4.Image = My.Resources.Resources.minus_solid
        PictureBox4.Location = New Point(500, 7)
        PictureBox4.Name = "PictureBox4"
        PictureBox4.Size = New Size(30, 30)
        PictureBox4.SizeMode = PictureBoxSizeMode.StretchImage
        PictureBox4.TabIndex = 1
        PictureBox4.TabStop = False
        ' 
        ' PictureBox3
        ' 
        PictureBox3.BackColor = Color.Red
        PictureBox3.BorderStyle = BorderStyle.FixedSingle
        PictureBox3.Image = My.Resources.Resources.xmark_solid
        PictureBox3.ImageLocation = ""
        PictureBox3.Location = New Point(536, 7)
        PictureBox3.Name = "PictureBox3"
        PictureBox3.Size = New Size(30, 30)
        PictureBox3.SizeMode = PictureBoxSizeMode.StretchImage
        PictureBox3.TabIndex = 0
        PictureBox3.TabStop = False
        ' 
        ' LinkLabel1
        ' 
        LinkLabel1.AutoSize = True
        LinkLabel1.LinkBehavior = LinkBehavior.HoverUnderline
        LinkLabel1.LinkColor = Color.Red
        LinkLabel1.Location = New Point(412, 488)
        LinkLabel1.Name = "LinkLabel1"
        LinkLabel1.Size = New Size(127, 20)
        LinkLabel1.TabIndex = 8
        LinkLabel1.TabStop = True
        LinkLabel1.Text = "Forgot password?"
        ' 
        ' Panel4
        ' 
        Panel4.Location = New Point(40, 538)
        Panel4.Name = "Panel4"
        Panel4.Size = New Size(497, 46)
        Panel4.TabIndex = 9
        ' 
        ' hoverTimer
        ' 
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.ForeColor = Color.Black
        Label3.Location = New Point(40, 488)
        Label3.Name = "Label3"
        Label3.Size = New Size(53, 20)
        Label3.TabIndex = 10
        Label3.Text = "Label3"
        Label3.Visible = False
        ' 
        ' Timer1
        ' 
        Timer1.Interval = 20000
        ' 
        ' LoginForm
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        BackColor = Color.White
        ClientSize = New Size(581, 789)
        ControlBox = False
        Controls.Add(Label3)
        Controls.Add(Panel4)
        Controls.Add(LinkLabel1)
        Controls.Add(Panel3)
        Controls.Add(Panel2)
        Controls.Add(Panel1)
        Controls.Add(Label2)
        Controls.Add(Label1)
        ForeColor = SystemColors.ControlLightLight
        Icon = CType(resources.GetObject("$this.Icon"), Icon)
        Name = "LoginForm"
        StartPosition = FormStartPosition.CenterScreen
        Text = "LoginForm"
        Panel1.ResumeLayout(False)
        Panel1.PerformLayout()
        CType(PictureBox1, ComponentModel.ISupportInitialize).EndInit()
        Panel2.ResumeLayout(False)
        Panel2.PerformLayout()
        CType(PictureBox2, ComponentModel.ISupportInitialize).EndInit()
        Panel3.ResumeLayout(False)
        Panel3.PerformLayout()
        CType(PictureBox4, ComponentModel.ISupportInitialize).EndInit()
        CType(PictureBox3, ComponentModel.ISupportInitialize).EndInit()
        ResumeLayout(False)
        PerformLayout()
    End Sub

    Friend WithEvents Label1 As Label
    Friend WithEvents Label2 As Label
    Friend WithEvents TextBox1 As TextBox
    Friend WithEvents TextBox2 As TextBox
    Friend WithEvents Panel1 As Panel
    Friend WithEvents Panel2 As Panel
    Friend WithEvents PictureBox1 As PictureBox
    Friend WithEvents PictureBox2 As PictureBox
    Friend WithEvents Panel3 As Panel
    Friend WithEvents PictureBox4 As PictureBox
    Friend WithEvents PictureBox3 As PictureBox
    Friend WithEvents LinkLabel1 As LinkLabel
    Friend WithEvents Panel4 As Panel
    Friend WithEvents hoverTimer As Timer
    Friend WithEvents Label3 As Label
    Friend WithEvents Timer1 As Timer
    Friend WithEvents Label5 As Label
    Friend WithEvents Label4 As Label
End Class
