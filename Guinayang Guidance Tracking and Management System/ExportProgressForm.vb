Imports System.Windows.Forms.VisualStyles.VisualStyleElement

Public Class ExportProgressForm
    Public Sub New()
        InitializeComponent()
    End Sub

    Public Sub UpdateProgress(current As Integer, total As Integer, status As String)
        If ProgressBar1.InvokeRequired Then
            ProgressBar1.Invoke(Sub()
                                    ProgressBar1.Maximum = total
                                    ProgressBar1.Value = current
                                    Label1.Text = status
                                End Sub)
        Else
            ProgressBar1.Maximum = total
            ProgressBar1.Value = current
            Label1.Text = status
        End If
        Application.DoEvents()
    End Sub

    Private Sub ExportProgressForm_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        CenterToScreen()
    End Sub
End Class