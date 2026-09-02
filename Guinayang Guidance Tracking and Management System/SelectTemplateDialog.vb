Imports System.Windows.Forms
Imports Guinayang_Guidance_Tracking_and_Management_System.Templates

Public Class SelectTemplateDialog

#Region "Properties"
    Public Property SelectedTemplate As TemplateModel = Nothing
#End Region

#Region "Constructor"
    Public Sub New(templates As List(Of TemplateModel))
        InitializeComponent()
        UiTheme.Apply(Me)
        ComboBox1.DataSource = templates
        ComboBox1.DisplayMember = "Name"
    End Sub
#End Region

#Region "Button Events"
    Private Sub btnOK_Click(sender As Object, e As EventArgs) Handles Button1.Click
        SelectedTemplate = TryCast(ComboBox1.SelectedItem, TemplateModel)
        Me.DialogResult = DialogResult.OK
        Me.Close()
    End Sub

    Private Sub btnCancel_Click(sender As Object, e As EventArgs) Handles Button2.Click
        SelectedTemplate = Nothing
        Me.DialogResult = DialogResult.Cancel
        Me.Close()
    End Sub
#End Region

End Class
