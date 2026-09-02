Imports System.IO

''' <summary>
''' Centralises the writable locations the demo build uses, replacing the
''' hard-coded C:\CaseExports and C:\GeneratedReports folders.
''' </summary>
Public Module AppPaths

    ''' <summary>Root folder for everything the demo writes: Documents\Guinayang Demo.</summary>
    Public ReadOnly Property DemoRoot As String
        Get
            Dim p = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Guinayang Demo")
            Directory.CreateDirectory(p)
            Return p
        End Get
    End Property

    Public ReadOnly Property CaseExports As String
        Get
            Dim p = Path.Combine(DemoRoot, "CaseExports")
            Directory.CreateDirectory(p)
            Return p
        End Get
    End Property

    Public ReadOnly Property GeneratedReports As String
        Get
            Dim p = Path.Combine(DemoRoot, "GeneratedReports")
            Directory.CreateDirectory(p)
            Return p
        End Get
    End Property

    ''' <summary>Resolve a template's stored path — absolute is used as-is, relative is under the exe folder.</summary>
    Public Function ResolveTemplatePath(content As String) As String
        If String.IsNullOrWhiteSpace(content) Then Return content
        If Path.IsPathRooted(content) Then Return content
        Return Path.Combine(Application.StartupPath, content)
    End Function

End Module
