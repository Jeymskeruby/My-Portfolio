Public Class ManualMessageDialog
    Public Property MessageText As String = String.Empty

    Public Sub New()
        InitializeComponent()
        UiTheme.Apply(Me)
    End Sub

    Private Sub btnSend_Click(sender As Object, e As EventArgs) Handles Button2.Click
        If String.IsNullOrWhiteSpace(TextBox1.Text) Then
            MessageBox.Show("Please enter a message.", "Validation",
                          MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return
        End If

        MessageText = TextBox1.Text
        Me.DialogResult = DialogResult.OK
        Me.Close()
    End Sub

    Private Sub btnCancel_Click(sender As Object, e As EventArgs) Handles Button1.Click
        Me.DialogResult = DialogResult.Cancel
        Me.Close()
    End Sub
End Class