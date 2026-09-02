Imports System.IO

Public Module AppLogger
    Private ReadOnly LogPath As String = Path.Combine(Application.StartupPath, "logs", "app_log.txt")

    Public Sub WriteLog(message As String)
        Try
            Dim dir = Path.GetDirectoryName(LogPath)
            If Not Directory.Exists(dir) Then Directory.CreateDirectory(dir)
            File.AppendAllText(LogPath, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss}  {message}{Environment.NewLine}")
        Catch
        End Try
    End Sub
End Module
