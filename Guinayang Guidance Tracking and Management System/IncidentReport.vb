Public Class IncidentReport
    Public Property IncidentType As String
    Public Property ownerId As String
    Public Property status As String
    Public Property UrgencyLevel As String
    Public Property attachments As List(Of String)
    Public Property contactInfo As String
    Public Property description As String
    Public Property incidentDate As String
    Public Property location As String
    Public Property timestamp As String
    Public Property IsComplete As Boolean
    Public Property Email As String

    ' Notification fields (previously written back to the Firestore document)
    Public Property Message As String
    Public Property LastMessageTimestamp As String
    Public Property IsManualMessage As Boolean
End Class
