''' <summary>
''' Notification-text generator. In the demo build there is no external messaging
''' channel — callers persist the returned text locally via IncidentStore.
''' </summary>
Public Class MessageHelper

    Public Sub New()
    End Sub

    ''' <summary>Acknowledgement text shown when a report moves from unseen to on-process.</summary>
    Public Function GenerateNotificationMessage(incidentType As String, status As String) As String
        If status IsNot Nothing AndAlso status.ToLower() = "on-process" Then
            If incidentType IsNot Nothing AndAlso incidentType.ToLower().Contains("counseling") Then
                Return "We have received your counseling request and will get back to you as soon as we can. The guidance department will contact you to schedule an appointment."
            Else
                Return "Your report has been acknowledged. The guidance team will now start the investigation on the matter stated in the report."
            End If
        End If

        Return String.Empty
    End Function

    Public Shared Function DeletedMessage() As String
        Return "Your report has been determined as false and has been deleted by the guidance department."
    End Function

    Public Shared Function ResolvedMessage() As String
        Return "Your report has been resolved and documentation has been generated."
    End Function

End Class
