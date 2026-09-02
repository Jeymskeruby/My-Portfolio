Imports System.Drawing.Drawing2D

''' <summary>
''' Central visual theme for the demo build. Keeps the Guinayang red/gold identity
''' but with deeper, less harsh tones, more white space and consistent typography.
''' Call UiTheme.Apply(Me) at the end of a form/usercontrol Load to retro-fit it
''' without touching the Designer files.
''' </summary>
Public Module UiTheme

#Region "Palette"
    Public ReadOnly PrimaryDark As Color = Color.FromArgb(150, 22, 27)     ' deep brick red — nav, headers, grid header
    Public ReadOnly Primary As Color = Color.FromArgb(178, 34, 40)         ' red — hover, accents
    Public ReadOnly PrimaryPressed As Color = Color.FromArgb(120, 18, 22)
    Public ReadOnly PrimarySoft As Color = Color.FromArgb(252, 233, 231)   ' red tint background
    Public ReadOnly Accent As Color = Color.FromArgb(226, 170, 45)         ' warm gold — selected nav, key accents
    Public ReadOnly AccentDark As Color = Color.FromArgb(196, 141, 26)
    Public ReadOnly AccentSoft As Color = Color.FromArgb(247, 232, 199)    ' gold tint — row selection
    Public ReadOnly AppBg As Color = Color.FromArgb(244, 245, 247)
    Public ReadOnly Surface As Color = Color.White
    Public ReadOnly SurfaceAlt As Color = Color.FromArgb(250, 250, 251)
    Public ReadOnly BorderClr As Color = Color.FromArgb(226, 228, 233)
    Public ReadOnly TextPrimary As Color = Color.FromArgb(33, 37, 43)
    Public ReadOnly TextSecondary As Color = Color.FromArgb(107, 114, 128)
    Public ReadOnly Success As Color = Color.FromArgb(46, 125, 50)
    Public ReadOnly SuccessSoft As Color = Color.FromArgb(232, 245, 233)
    Public ReadOnly WarnSoft As Color = Color.FromArgb(255, 244, 214)
    Public ReadOnly NeutralSoft As Color = Color.FromArgb(240, 242, 244)

    ' chart series
    Public ReadOnly ChartCases As Color = Color.FromArgb(178, 34, 40)
    Public ReadOnly ChartReports As Color = Color.FromArgb(226, 170, 45)
    Public ReadOnly ChartResolved As Color = Color.FromArgb(46, 125, 50)

    Public ReadOnly BaseFontName As String = "Segoe UI"
#End Region

#Region "Colour remap"
    Private ReadOnly remap As New Dictionary(Of Integer, Color)

    Sub New()
        Add(Color.FromArgb(194, 4, 16), PrimaryDark)
        Add(Color.FromArgb(196, 4, 16), PrimaryDark)
        Add(Color.FromArgb(192, 0, 0), PrimaryDark)
        Add(Color.FromArgb(245, 205, 4), Accent)
        Add(Color.FromArgb(237, 185, 38), Accent)
        Add(Color.FromArgb(255, 128, 0), Accent)
        Add(Color.FromArgb(255, 255, 128), AccentSoft)
        Add(Color.FromArgb(252, 231, 200), AccentSoft)
        Add(Color.FromArgb(255, 224, 192), PrimarySoft)
        Add(Color.FromArgb(192, 255, 192), SuccessSoft)
        Add(Color.FromArgb(128, 255, 128), SuccessSoft)
        Add(Color.FromArgb(0, 192, 0), Success)
        Add(Color.FromArgb(224, 224, 224), Color.FromArgb(238, 239, 242))
        Add(Color.FromArgb(140, 141, 148), TextSecondary)
        Add(Color.FromArgb(45, 45, 45), TextPrimary)
        Add(Color.FromArgb(64, 64, 64), TextPrimary)
        Add(Color.Coral, PrimaryDark)
        Add(Color.Crimson, Primary)
        Add(Color.Firebrick, PrimaryDark)
        Add(Color.Maroon, PrimaryDark)
        Add(Color.DarkRed, PrimaryDark)
        Add(Color.Red, Primary)
        Add(Color.Gold, Accent)
        Add(Color.PaleGoldenrod, AccentSoft)
        Add(Color.Yellow, Color.FromArgb(240, 205, 130))
        Add(Color.Gainsboro, Color.FromArgb(238, 239, 242))
        Add(Color.WhiteSmoke, SurfaceAlt)
        Add(Color.LightCoral, PrimarySoft)
        Add(Color.Salmon, PrimarySoft)
        Add(Color.LightSalmon, PrimarySoft)
        Add(Color.LightGreen, SuccessSoft)
        Add(Color.PaleGreen, SuccessSoft)
        Add(Color.LightYellow, WarnSoft)
        Add(Color.LightGray, NeutralSoft)
        Add(Color.LightSlateGray, TextSecondary)
    End Sub

    Private Sub Add(from As Color, to_ As Color)
        remap(from.ToArgb()) = to_
    End Sub

    Public Function Remapped(c As Color) As Color
        Dim v As Color = Nothing
        If remap.TryGetValue(c.ToArgb(), v) Then Return v
        Return c
    End Function
#End Region

#Region "Apply"
    Public Sub Apply(root As Control)
        If root Is Nothing Then Return
        ApplyOne(root)

        If TypeOf root Is DataGridView Then
            StyleGrid(DirectCast(root, DataGridView))
            Return
        End If
        If TypeOf root Is ComboBox OrElse TypeOf root Is TextBox Then Return

        For Each child As Control In root.Controls
            Apply(child)
        Next
    End Sub

    ' Cache the fonts Apply/StyleGrid/StyleButton create so we allocate a handful for the
    ' process, not one per control per navigation. These are intentionally never disposed.
    Private ReadOnly fontCache As New Dictionary(Of String, Font)

    Public Function CachedFont(family As String, size As Single, style As FontStyle) As Font
        Dim key = $"{family}|{size}|{CInt(style)}"
        Dim f As Font = Nothing
        If Not fontCache.TryGetValue(key, f) Then
            f = New Font(family, size, style)
            fontCache(key) = f
        End If
        Return f
    End Function

    Private Sub ApplyOne(c As Control)
        ' Typography — normalise stray font families to Segoe UI, keep size + style.
        Try
            If c.Font IsNot Nothing AndAlso Not c.Font.Name.StartsWith("Segoe UI") Then
                c.Font = CachedFont(BaseFontName, c.Font.SizeInPoints, c.Font.Style)
            End If
        Catch
        End Try

        ' Colour remap — only touch values we explicitly recognise.
        Dim nb = Remapped(c.BackColor)
        If nb.ToArgb() <> c.BackColor.ToArgb() Then c.BackColor = nb
        Dim nf = Remapped(c.ForeColor)
        If nf.ToArgb() <> c.ForeColor.ToArgb() Then c.ForeColor = nf

        If TypeOf c Is Button Then StyleButton(DirectCast(c, Button))
        If TypeOf c Is ComboBox Then DirectCast(c, ComboBox).FlatStyle = FlatStyle.Flat
    End Sub
#End Region

#Region "Widget styles"
    Public Sub StyleButton(b As Button)
        If String.IsNullOrEmpty(b.Text) Then Return   ' leave icon-only buttons alone
        b.FlatStyle = FlatStyle.Flat
        b.UseVisualStyleBackColor = False
        b.Cursor = Cursors.Hand
        Try
            b.Font = CachedFont("Segoe UI Semibold", Math.Max(8.5F, b.Font.SizeInPoints), FontStyle.Bold)
        Catch
        End Try

        Dim t = If(b.Text, "").ToLowerInvariant()
        Dim isDanger = t.Contains("delete") OrElse t.Contains("remove")
        Dim isAdd = t = "add" OrElse t.Contains("add ") OrElse t.Contains("register") OrElse t.Contains("save") OrElse t.Contains("+ add")
        Dim bg = b.BackColor.ToArgb()
        Dim looksDefault = bg = SystemColors.Control.ToArgb() OrElse
                           bg = Color.FromArgb(238, 239, 242).ToArgb() OrElse
                           bg = Color.Gainsboro.ToArgb() OrElse
                           bg = Color.White.ToArgb() OrElse
                           bg = SurfaceAlt.ToArgb()
        Dim isPrimary = bg = PrimaryDark.ToArgb() OrElse bg = Primary.ToArgb()

        If isDanger Then
            b.BackColor = Surface
            b.ForeColor = Primary
            b.FlatAppearance.BorderSize = 1
            b.FlatAppearance.BorderColor = Primary
            b.FlatAppearance.MouseOverBackColor = PrimarySoft
            b.FlatAppearance.MouseDownBackColor = AccentSoft
        ElseIf isAdd Then
            b.BackColor = Success
            b.ForeColor = Color.White
            b.FlatAppearance.BorderSize = 0
            b.FlatAppearance.MouseOverBackColor = Color.FromArgb(39, 105, 43)
            b.FlatAppearance.MouseDownBackColor = Color.FromArgb(33, 90, 37)
        ElseIf isPrimary OrElse looksDefault Then
            b.BackColor = PrimaryDark
            b.ForeColor = Color.White
            b.FlatAppearance.BorderSize = 0
            b.FlatAppearance.MouseOverBackColor = Primary
            b.FlatAppearance.MouseDownBackColor = PrimaryPressed
        Else
            ' any other tint → clean neutral bordered button with guaranteed contrast
            Dim lum = 0.299 * b.BackColor.R + 0.587 * b.BackColor.G + 0.114 * b.BackColor.B
            b.ForeColor = If(lum > 150, TextPrimary, Color.White)
            b.FlatAppearance.BorderSize = 1
            b.FlatAppearance.BorderColor = BorderClr
            b.FlatAppearance.MouseOverBackColor = AppBg
        End If
    End Sub

    Public Sub StyleGrid(g As DataGridView)
        g.EnableHeadersVisualStyles = False
        g.BackgroundColor = Surface
        g.BorderStyle = BorderStyle.None
        g.GridColor = BorderClr
        g.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal
        g.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None
        g.RowHeadersBorderStyle = DataGridViewHeaderBorderStyle.None
        g.RowHeadersVisible = False
        g.AllowUserToResizeRows = False
        g.AllowUserToAddRows = False
        g.SelectionMode = DataGridViewSelectionMode.FullRowSelect
        g.MultiSelect = False
        g.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing
        g.ColumnHeadersHeight = 42

        With g.ColumnHeadersDefaultCellStyle
            .BackColor = PrimaryDark
            .ForeColor = Color.White
            .SelectionBackColor = PrimaryDark
            .SelectionForeColor = Color.White
            .Font = CachedFont("Segoe UI Semibold", 9.5F, FontStyle.Bold)
            .Alignment = DataGridViewContentAlignment.MiddleLeft
            .Padding = New Padding(10, 0, 6, 0)
        End With
        With g.DefaultCellStyle
            .Font = CachedFont(BaseFontName, 9.5F, FontStyle.Regular)
            .ForeColor = TextPrimary
            .BackColor = Surface
            .SelectionBackColor = AccentSoft
            .SelectionForeColor = TextPrimary
            .Padding = New Padding(10, 6, 6, 6)
        End With
        g.AlternatingRowsDefaultCellStyle.BackColor = SurfaceAlt
        g.AlternatingRowsDefaultCellStyle.SelectionBackColor = AccentSoft
        g.AlternatingRowsDefaultCellStyle.SelectionForeColor = TextPrimary
        g.RowTemplate.Height = 40
        For Each r As DataGridViewRow In g.Rows
            r.Height = 40
        Next
    End Sub

    ''' <summary>Give a control a rounded rectangular region. Shared helper — replaces the per-form MakeRoundedPanel copies.</summary>
    Public Sub Round(c As Control, radius As Integer)
        Dim r = c.ClientRectangle
        r.Width -= 1 : r.Height -= 1
        Using p As New GraphicsPath()
            p.AddArc(r.Left, r.Top, radius, radius, 180, 90)
            p.AddArc(r.Right - radius, r.Top, radius, radius, 270, 90)
            p.AddArc(r.Right - radius, r.Bottom - radius, radius, radius, 0, 90)
            p.AddArc(r.Left, r.Bottom - radius, radius, radius, 90, 90)
            p.CloseFigure()
            Dim old = c.Region
            c.Region = New Region(p)
            old?.Dispose()
        End Using
    End Sub

    ''' <summary>Give a control a circular region sized to the control itself. Replaces the per-form MakePanelCircle copies (which hard-coded one control's size).</summary>
    Public Sub CircleRegion(c As Control)
        Using p As New GraphicsPath()
            p.AddEllipse(0, 0, Math.Max(1, c.Width - 2), Math.Max(1, c.Height - 2))
            Dim old = c.Region
            c.Region = New Region(p)
            old?.Dispose()
        End Using
    End Sub
#End Region

End Module
