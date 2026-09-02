<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class ManualMessageDialog
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
        TableLayoutPanel1 = New TableLayoutPanel()
        TextBox1 = New TextBox()
        Button1 = New Button()
        Button2 = New Button()
        TableLayoutPanel1.SuspendLayout()
        SuspendLayout()
        ' 
        ' TableLayoutPanel1
        ' 
        TableLayoutPanel1.ColumnCount = 7
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 1.00755668F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 8.75F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 28.75F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 22.375F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 30.375F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 7.375F))
        TableLayoutPanel1.ColumnStyles.Add(New ColumnStyle(SizeType.Percent, 1.13350129F))
        TableLayoutPanel1.Controls.Add(TextBox1, 1, 1)
        TableLayoutPanel1.Controls.Add(Button1, 2, 3)
        TableLayoutPanel1.Controls.Add(Button2, 4, 3)
        TableLayoutPanel1.Dock = DockStyle.Fill
        TableLayoutPanel1.Location = New Point(0, 0)
        TableLayoutPanel1.Name = "TableLayoutPanel1"
        TableLayoutPanel1.RowCount = 5
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 2.93459129F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 79.1252747F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 3.409091F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Percent, 14.318182F))
        TableLayoutPanel1.RowStyles.Add(New RowStyle(SizeType.Absolute, 8F))
        TableLayoutPanel1.Size = New Size(800, 450)
        TableLayoutPanel1.TabIndex = 0
        ' 
        ' TextBox1
        ' 
        TableLayoutPanel1.SetColumnSpan(TextBox1, 5)
        TextBox1.Dock = DockStyle.Fill
        TextBox1.Location = New Point(11, 15)
        TextBox1.Multiline = True
        TextBox1.Name = "TextBox1"
        TextBox1.Size = New Size(775, 344)
        TextBox1.TabIndex = 0
        ' 
        ' Button1
        ' 
        Button1.BackColor = Color.White
        Button1.DialogResult = DialogResult.Cancel
        Button1.Dock = DockStyle.Fill
        Button1.FlatStyle = FlatStyle.Flat
        Button1.Location = New Point(81, 380)
        Button1.Name = "Button1"
        Button1.Size = New Size(224, 57)
        Button1.TabIndex = 1
        Button1.Text = "Cancel"
        Button1.UseVisualStyleBackColor = False
        ' 
        ' Button2
        ' 
        Button2.BackColor = Color.FromArgb(CByte(192), CByte(255), CByte(192))
        Button2.DialogResult = DialogResult.OK
        Button2.Dock = DockStyle.Fill
        Button2.FlatStyle = FlatStyle.Flat
        Button2.Location = New Point(490, 380)
        Button2.Name = "Button2"
        Button2.Size = New Size(237, 57)
        Button2.TabIndex = 2
        Button2.Text = "Send "
        Button2.UseVisualStyleBackColor = False
        ' 
        ' ManualMessageDialog
        ' 
        AutoScaleDimensions = New SizeF(8F, 20F)
        AutoScaleMode = AutoScaleMode.Font
        ClientSize = New Size(800, 450)
        ControlBox = False
        Controls.Add(TableLayoutPanel1)
        MaximizeBox = False
        MinimizeBox = False
        Name = "ManualMessageDialog"
        SizeGripStyle = SizeGripStyle.Hide
        StartPosition = FormStartPosition.CenterScreen
        Text = "ManualMessageDialog"
        TableLayoutPanel1.ResumeLayout(False)
        TableLayoutPanel1.PerformLayout()
        ResumeLayout(False)
    End Sub

    Friend WithEvents TableLayoutPanel1 As TableLayoutPanel
    Friend WithEvents TextBox1 As TextBox
    Friend WithEvents Button1 As Button
    Friend WithEvents Button2 As Button
End Class
