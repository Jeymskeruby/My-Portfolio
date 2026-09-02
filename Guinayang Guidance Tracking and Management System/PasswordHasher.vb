Imports System.Security.Cryptography

''' <summary>
''' Single implementation of the PBKDF2 password hashing that used to be copy-pasted
''' across LoginForm / UserManagementForm / AddEditUserForm.
''' SHA-1 is kept deliberately so hashes written by earlier builds still verify.
''' </summary>
Public Module PasswordHasher

    Private Const Iterations As Integer = 100000
    Private Const KeyBytes As Integer = 32
    Private Const SaltBytes As Integer = 16

    Public Class UserRecord
        Public Property Hash As String
        Public Property Salt As String
    End Class

    Public Function NewSalt() As String
        Return Convert.ToBase64String(RandomNumberGenerator.GetBytes(SaltBytes))
    End Function

    Public Function Hash(password As String, salt As String) As String
        Using pbkdf2 As New Rfc2898DeriveBytes(password, Convert.FromBase64String(salt), Iterations, HashAlgorithmName.SHA1)
            Return Convert.ToBase64String(pbkdf2.GetBytes(KeyBytes))
        End Using
    End Function

    Public Function Create(password As String) As UserRecord
        Dim salt = NewSalt()
        Return New UserRecord() With {.Salt = salt, .Hash = Hash(password, salt)}
    End Function

End Module
