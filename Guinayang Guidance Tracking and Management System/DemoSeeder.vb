Imports Microsoft.Data.Sqlite

''' <summary>
''' Builds and restores the deterministic demo dataset for the portfolio build.
''' Owns the student_records.db schema so it can run before Form1 is ever created
''' (from LoginForm) as well as from an in-app "Reset Demo Data" action.
''' users.db (accounts / audit / sessions) is never touched here.
''' </summary>
Public Module DemoSeeder

    Private ReadOnly connStr As String = "Data Source=student_records.db"

    ' ---------------------------------------------------------------- public API

    ''' <summary>Seed only if the database has no students yet (first run).</summary>
    Public Sub EnsureSeededOnce()
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureSchema(conn)
            Dim count As Long
            Using cmd As New SqliteCommand("SELECT COUNT(*) FROM Students WHERE IFNULL(isDeleted,0) = 0", conn)
                count = Convert.ToInt64(cmd.ExecuteScalar())
            End Using
            If count = 0 Then
                Using tx = conn.BeginTransaction()
                    Wipe(conn, tx)
                    InsertAll(conn, tx)
                    tx.Commit()
                End Using
            End If
        End Using
    End Sub

    ''' <summary>Wipe and rebuild the demo dataset from scratch.</summary>
    Public Sub ResetDemoData()
        SqliteConnection.ClearAllPools()
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureSchema(conn)
            Using tx = conn.BeginTransaction()
                Wipe(conn, tx)
                InsertAll(conn, tx)
                tx.Commit()
            End Using
        End Using
        SqliteConnection.ClearAllPools()
        AppLogger.WriteLog("Demo data reset to seed state.")
    End Sub

    ' ------------------------------------------------------------------- schema

    Public Sub EnsureSchema(conn As SqliteConnection)
        Dim ddl As String() = {
            "CREATE TABLE IF NOT EXISTS Students (
                LRN TEXT PRIMARY KEY, Surname TEXT, FirstName TEXT, MiddleInitial TEXT,
                Age INTEGER, Birthday TEXT, Address TEXT, ContactNumber TEXT, Email TEXT,
                Token TEXT, SourceCollection TEXT, isDeleted INTEGER DEFAULT 0)",
            "CREATE TABLE IF NOT EXISTS Guardians (
                GuardianID INTEGER PRIMARY KEY AUTOINCREMENT, Relationship TEXT, LRN TEXT,
                Name TEXT, ContactInfo TEXT, isDeleted INTEGER DEFAULT 0,
                FOREIGN KEY (LRN) REFERENCES Students(LRN) ON UPDATE CASCADE ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS AcademicHistory (
                AcademicID INTEGER PRIMARY KEY AUTOINCREMENT, LRN TEXT, Grade TEXT, Section TEXT,
                SchoolYear TEXT, Adviser TEXT, isDeleted INTEGER DEFAULT 0,
                FOREIGN KEY (LRN) REFERENCES Students(LRN) ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS CaseRecords (
                CaseID INTEGER PRIMARY KEY AUTOINCREMENT, LRN TEXT, FirstName TEXT, MiddleName TEXT,
                LastName TEXT, Date TEXT, Time TEXT, PoliceNotified TEXT, Location TEXT,
                IncidentDescription TEXT, Witnesses TEXT, Injured TEXT, InjuryDescription TEXT,
                MedicalTreatment TEXT, InjuryLocation TEXT, Resolution TEXT, ResolutionDate TEXT,
                GuidanceCouncilor TEXT, Finalized INTEGER DEFAULT 0, isDeleted INTEGER DEFAULT 0,
                FOREIGN KEY (LRN) REFERENCES Students(LRN) ON DELETE CASCADE)",
            IncidentStore.CreateTableSql,
            "PRAGMA foreign_keys = ON"
        }
        For Each sql In ddl
            Using cmd As New SqliteCommand(sql, conn)
                cmd.ExecuteNonQuery()
            End Using
        Next
    End Sub

    ' -------------------------------------------------------------------- wipe

    Private Sub Wipe(conn As SqliteConnection, tx As SqliteTransaction)
        For Each t In {"Incidents", "CaseRecords", "AcademicHistory", "Guardians", "Students"}
            Exec(conn, tx, $"DELETE FROM {t}")
        Next
        Try
            Exec(conn, tx, "DELETE FROM sqlite_sequence WHERE name IN ('Guardians','AcademicHistory','CaseRecords')")
        Catch
            ' sqlite_sequence may not exist yet — ignore
        End Try
    End Sub

    ' ------------------------------------------------------------------ inserts

    Private Structure DemoStudent
        Dim Surname, First, MI, Birthday, Address, Contact, Email, Grade, Section, Adviser As String
        Dim Age As Integer
        Dim GuardianName, GuardianRel, GuardianContact As String
    End Structure

    Private Function Students() As DemoStudent()
        Return {
            NewStu("Dela Cruz", "Angelo", "R", "03/14/2011", "128 Mabini St., Guinayang", "09171234501", "angelo.delacruz@example.com", "7", "A", "Mrs. Ramos", "Rosa Dela Cruz", "Mother", "09181234501"),
            NewStu("Santos", "Bea", "M", "07/02/2011", "12 Rizal Ave., Guinayang", "09171234502", "bea.santos@example.com", "7", "B", "Mrs. Ramos", "Mario Santos", "Father", "09181234502"),
            NewStu("Reyes", "Carlo", "T", "05/21/2010", "45 Bonifacio St., Guinayang", "09171234503", "carlo.reyes@example.com", "8", "A", "Mr. Aquino", "Elena Reyes", "Mother", "09181234503"),
            NewStu("Bautista", "Diana", "L", "11/09/2010", "7 Luna St., Guinayang", "09171234504", "diana.bautista@example.com", "8", "B", "Mr. Aquino", "Jose Bautista", "Father", "09181234504"),
            NewStu("Gonzales", "Elias", "P", "01/30/2009", "90 Del Pilar St., Guinayang", "09171234505", "elias.gonzales@example.com", "9", "A", "Ms. Cruz", "Marites Gonzales", "Mother", "09181234505"),
            NewStu("Torres", "Faith", "A", "09/17/2009", "33 Aguinaldo St., Guinayang", "09171234506", "faith.torres@example.com", "9", "B", "Ms. Cruz", "Ramon Torres", "Father", "09181234506"),
            NewStu("Flores", "Gabriel", "S", "04/06/2008", "56 Quezon St., Guinayang", "09171234507", "gabriel.flores@example.com", "10", "A", "Mr. Villar", "Cristina Flores", "Mother", "09181234507"),
            NewStu("Castillo", "Hannah", "D", "12/25/2008", "18 Roxas St., Guinayang", "09171234508", "hannah.castillo@example.com", "10", "B", "Mr. Villar", "Danilo Castillo", "Father", "09181234508"),
            NewStu("Ramos", "Isaac", "V", "06/11/2007", "72 Magsaysay St., Guinayang", "09171234509", "isaac.ramos@example.com", "11", "A", "Mrs. Lim", "Grace Ramos", "Mother", "09181234509"),
            NewStu("Mendoza", "Julia", "C", "08/28/2007", "5 Osmena St., Guinayang", "09171234510", "julia.mendoza@example.com", "11", "B", "Mrs. Lim", "Peter Mendoza", "Father", "09181234510"),
            NewStu("Aquino", "Kyle", "B", "02/19/2006", "61 Laurel St., Guinayang", "09171234511", "kyle.aquino@example.com", "12", "A", "Mr. Domingo", "Nora Aquino", "Mother", "09181234511"),
            NewStu("Navarro", "Lara", "F", "10/03/2006", "24 Marcos St., Guinayang", "09171234512", "lara.navarro@example.com", "12", "B", "Mr. Domingo", "Victor Navarro", "Father", "09181234512")
        }
    End Function

    Private Function NewStu(sn As String, fn As String, mi As String, bday As String, addr As String, contact As String, email As String, grade As String, section As String, adviser As String, gName As String, gRel As String, gContact As String) As DemoStudent
        Dim s As New DemoStudent()
        s.Surname = sn : s.First = fn : s.MI = mi : s.Birthday = bday : s.Address = addr
        s.Contact = contact : s.Email = email : s.Grade = grade : s.Section = section : s.Adviser = adviser
        s.GuardianName = gName : s.GuardianRel = gRel : s.GuardianContact = gContact
        s.Age = CInt(Math.Floor((DateTime.Today - DateTime.ParseExact(bday, "MM/dd/yyyy", Globalization.CultureInfo.InvariantCulture)).TotalDays / 365.25))
        Return s
    End Function

    Private Function MakeLrn(index0 As Integer) As String
        Return "10000000000" & (index0 + 1).ToString("D2")
    End Function

    Private Sub InsertAll(conn As SqliteConnection, tx As SqliteTransaction)
        Dim stus = Students()
        Dim prevYear As String = "2024-2025"
        Dim curYear As String = $"{DateTime.Today.Year}-{DateTime.Today.Year + 1}"

        Dim guardianId As Integer = 0
        Dim academicId As Integer = 0

        For i = 0 To stus.Length - 1
            Dim s = stus(i)
            Dim lrn = MakeLrn(i)

            Exec(conn, tx,
                "INSERT INTO Students (LRN, Surname, FirstName, MiddleInitial, Age, Birthday, Address, ContactNumber, Email, Token, SourceCollection, isDeleted) " &
                "VALUES (@lrn,@sn,@fn,@mi,@age,@bday,@addr,@contact,@email,'','demo',0)",
                P("@lrn", lrn), P("@sn", s.Surname), P("@fn", s.First), P("@mi", s.MI), P("@age", s.Age),
                P("@bday", s.Birthday), P("@addr", s.Address), P("@contact", s.Contact), P("@email", s.Email))

            guardianId += 1
            Exec(conn, tx,
                "INSERT INTO Guardians (GuardianID, Relationship, LRN, Name, ContactInfo, isDeleted) " &
                "VALUES (@gid,@rel,@lrn,@name,@contact,0)",
                P("@gid", guardianId), P("@rel", s.GuardianRel), P("@lrn", lrn),
                P("@name", s.GuardianName), P("@contact", s.GuardianContact))

            ' Two academic-history rows per student: a prior year and the current year.
            Dim prevGrade = Math.Max(7, CInt(s.Grade) - 1).ToString()
            academicId += 1
            Exec(conn, tx,
                "INSERT INTO AcademicHistory (AcademicID, LRN, Grade, Section, SchoolYear, Adviser, isDeleted) " &
                "VALUES (@aid,@lrn,@grade,@section,@sy,@adviser,0)",
                P("@aid", academicId), P("@lrn", lrn), P("@grade", prevGrade), P("@section", s.Section),
                P("@sy", prevYear), P("@adviser", s.Adviser))
            academicId += 1
            Exec(conn, tx,
                "INSERT INTO AcademicHistory (AcademicID, LRN, Grade, Section, SchoolYear, Adviser, isDeleted) " &
                "VALUES (@aid,@lrn,@grade,@section,@sy,@adviser,0)",
                P("@aid", academicId), P("@lrn", lrn), P("@grade", s.Grade), P("@section", s.Section),
                P("@sy", curYear), P("@adviser", s.Adviser))
        Next

        InsertCases(conn, tx, stus)
        InsertIncidents(conn, tx)

        ' Keep AUTOINCREMENT counters ahead of the explicit ids we assigned.
        Exec(conn, tx, "INSERT OR REPLACE INTO sqlite_sequence(name, seq) VALUES ('Guardians', @g),('AcademicHistory', @a),('CaseRecords', @c)",
             P("@g", guardianId), P("@a", academicId), P("@c", 18))
    End Sub

    Private Sub InsertCases(conn As SqliteConnection, tx As SqliteTransaction, stus As DemoStudent())
        ' studentIndex, date, time, police, location, description, witnesses, injured, injuryDesc, treatment, injuryLoc, resolution, councilor, finalized
        Dim rows = New Object()() {
            New Object() {0, DateTime.Today.AddMonths(-1), "10:15 AM", "No", "Grade 7 Corridor", "Verbal altercation between two students during recess.", "Mrs. Ramos", "No", "", "", "", "Mediation conducted; both students apologized.", "Ms. Cruz", 1},
            New Object() {0, DateTime.Today.AddMonths(-5), "01:40 PM", "No", "Canteen", "Student caught cutting class repeatedly.", "Canteen staff", "No", "", "", "", "Referred to adviser; parent conference scheduled.", "Ms. Cruz", 1},
            New Object() {2, DateTime.Today.AddDays(-9), "09:05 AM", "No", "Covered Court", "Minor injury during PE basketball drill.", "PE Teacher", "Yes", "Sprained left ankle", "Ice pack and rest at clinic", "Left ankle", "", "Mr. Aquino", 0},
            New Object() {3, DateTime.Today.AddMonths(-2), "02:20 PM", "No", "Library", "Damaged a library book and denied responsibility.", "Librarian", "No", "", "", "", "Student replaced the book; counseling session done.", "Mr. Aquino", 1},
            New Object() {4, DateTime.Today.AddMonths(-3), "11:30 AM", "Yes", "School Gate", "Altercation with a student from another section.", "Security Guard", "Yes", "Minor bruise on right arm", "Cleaned and bandaged at clinic", "Right arm", "", "Ms. Cruz", 0},
            New Object() {5, DateTime.Today.AddMonths(-4), "08:45 AM", "No", "Grade 9 Room B", "Bullying report — name-calling toward a classmate.", "Ms. Cruz", "No", "", "", "", "Anti-bullying intervention; behavior contract signed.", "Ms. Cruz", 1},
            New Object() {6, DateTime.Today.AddMonths(-6), "03:10 PM", "No", "Computer Laboratory", "Unauthorized use of another student's account.", "Lab In-charge", "No", "", "", "", "Warning issued; digital-citizenship session done.", "Mr. Villar", 1},
            New Object() {7, DateTime.Today.AddMonths(-7), "12:50 PM", "No", "Hallway", "Repeated tardiness and incomplete requirements.", "Adviser", "No", "", "", "", "Guidance counseling and study plan created.", "Mr. Villar", 1},
            New Object() {1, DateTime.Today.AddMonths(-8), "10:00 AM", "No", "Grade 7 Room B", "Disruptive behavior during class discussion.", "Subject Teacher", "No", "", "", "", "Behavior monitoring for two weeks.", "Ms. Cruz", 1},
            New Object() {2, DateTime.Today.AddMonths(-9), "01:15 PM", "No", "Covered Court", "Skipped flag ceremony without permission.", "Prefect of Discipline", "No", "", "", "", "Verbal reprimand; parent informed.", "Mr. Aquino", 1},
            New Object() {4, DateTime.Today.AddDays(-20), "09:40 AM", "No", "Guidance Office", "Requested counseling for family-related stress.", "None", "No", "", "", "", "", "Ms. Cruz", 0},
            New Object() {8, DateTime.Today.AddMonths(-2).AddDays(-3), "02:00 PM", "No", "Grade 11 Room A", "Caught using phone during examination.", "Proctor", "No", "", "", "", "Exam paper reviewed; honesty policy discussed.", "Mrs. Lim", 1},
            New Object() {0, DateTime.Today.AddYears(-1), "10:30 AM", "No", "Grade 6 Corridor", "Pushing incident while lining up.", "Adviser", "No", "", "", "", "Both students counseled; parents notified.", "Ms. Cruz", 1},
            New Object() {3, DateTime.Today.AddYears(-1).AddMonths(-1), "11:05 AM", "Yes", "Basketball Court", "Collision during intramurals game.", "PE Teacher", "Yes", "Cut on the forehead", "First aid; referred to health center", "Forehead", "Recovered fully; cleared by school nurse.", "Mr. Aquino", 1},
            New Object() {5, DateTime.Today.AddYears(-1).AddMonths(-2), "08:20 AM", "No", "Classroom", "Vandalism on a classroom desk.", "Adviser", "No", "", "", "", "Student cleaned the desk and apologized.", "Ms. Cruz", 1},
            New Object() {6, DateTime.Today.AddYears(-1).AddMonths(-4), "03:30 PM", "No", "Gate 2", "Left school premises without a gate pass.", "Security Guard", "No", "", "", "", "Warning and parent conference.", "Mr. Villar", 1},
            New Object() {9, DateTime.Today.AddYears(-2), "01:50 PM", "No", "Grade 10 Room B", "Conflict over group-project workload.", "Subject Teacher", "No", "", "", "", "Group mediation; roles reassigned.", "Mrs. Lim", 1},
            New Object() {10, DateTime.Today.AddYears(-2).AddMonths(-3), "09:15 AM", "No", "Guidance Office", "Career-guidance counseling session.", "None", "No", "", "", "", "Career plan drafted with student.", "Mr. Domingo", 1}
        }

        Dim caseId As Integer = 0
        For Each r In rows
            caseId += 1
            Dim si = CInt(r(0))
            Dim s = stus(si)
            Dim d = CType(r(1), DateTime)
            Dim finalized = CInt(r(13))
            Dim resolutionDate As String = If(finalized = 1, d.AddDays(7).ToString("yyyy-MM-dd"), "")
            Exec(conn, tx,
                "INSERT INTO CaseRecords (CaseID, LRN, FirstName, MiddleName, LastName, Date, Time, PoliceNotified, Location, " &
                "IncidentDescription, Witnesses, Injured, InjuryDescription, MedicalTreatment, InjuryLocation, Resolution, " &
                "ResolutionDate, GuidanceCouncilor, Finalized, isDeleted) VALUES " &
                "(@id,@lrn,@fn,@mn,@ln,@date,@time,@police,@loc,@desc,@wit,@inj,@injd,@med,@injl,@res,@resd,@coun,@fin,0)",
                P("@id", caseId), P("@lrn", MakeLrn(si)), P("@fn", s.First), P("@mn", s.MI), P("@ln", s.Surname),
                P("@date", d.ToString("yyyy-MM-dd")), P("@time", CStr(r(2))), P("@police", CStr(r(3))), P("@loc", CStr(r(4))),
                P("@desc", CStr(r(5))), P("@wit", CStr(r(6))), P("@inj", CStr(r(7))), P("@injd", CStr(r(8))),
                P("@med", CStr(r(9))), P("@injl", CStr(r(10))), P("@res", CStr(r(11))), P("@resd", resolutionDate),
                P("@coun", CStr(r(12))), P("@fin", finalized))
        Next
    End Sub

    Private Sub InsertIncidents(conn As SqliteConnection, tx As SqliteTransaction)
        ' id, type, status, urgency, contact, description, daysAgo, location, email, attachments-json, message, isManual
        Dim rows = New Object()() {
            New Object() {"demo-incident-01", "Bullying", "unseen", "High", "Concerned Parent", "A student is repeatedly teased about their accent in Grade 8.", 2, "Grade 8 Room A", "parent01@example.com", "[""images"",""file_solid1""]", "", 0},
            New Object() {"demo-incident-02", "Fighting", "unseen", "High", "Teacher on Duty", "Two students exchanged blows near the canteen after lunch.", 4, "Canteen Area", "teacher02@example.com", "[""images""]", "", 0},
            New Object() {"demo-incident-03", "Property Damage", "unseen", "Medium", "Anonymous", "A window in the science lab was broken during break time.", 6, "Science Laboratory", "anon03@example.com", "[]", "", 0},
            New Object() {"demo-incident-04", "Vandalism", "unseen", "Low", "Student Council", "Graffiti found on the second-floor stairwell wall.", 9, "2F Stairwell", "council04@example.com", "[""images"",""file_solid1""]", "", 0},
            New Object() {"demo-incident-05", "Counseling Request", "on-process", "Medium", "Julia Mendoza", "Student requests counseling regarding academic stress and workload.", 12, "Guidance Office", "julia.mendoza@example.com", "[]", "Your report has been received and is now being reviewed by the guidance office.", 0},
            New Object() {"demo-incident-06", "Theft", "on-process", "High", "Faith Torres", "Wallet reported missing from a bag left in the classroom.", 16, "Grade 9 Room B", "faith.torres@example.com", "[""images""]", "We are currently coordinating with your adviser on this matter.", 1},
            New Object() {"demo-incident-07", "Truancy", "on-process", "Low", "Adviser", "Student has been absent for five consecutive days without notice.", 21, "Grade 10 Room A", "adviser07@example.com", "[]", "Your report is being processed. A home visit is being arranged.", 0},
            New Object() {"demo-incident-08", "Bullying", "resolved", "Medium", "Concerned Classmate", "Group chat messages excluding and mocking a classmate.", 27, "Online / Grade 11", "classmate08@example.com", "[""images"",""file_solid1""]", "Your report has been resolved. Mediation was completed and monitoring is in place.", 0},
            New Object() {"demo-incident-09", "Property Damage", "resolved", "Low", "Maintenance Staff", "A chair was found broken in the AVR; reported for record.", 33, "Audio-Visual Room", "maintenance09@example.com", "[]", "Your report has been resolved and the item has been repaired.", 0},
            New Object() {"demo-incident-10", "Fighting", "resolved", "High", "Security Guard", "Shoving incident at the gate during dismissal; separated quickly.", 40, "Main Gate", "security10@example.com", "[""images""]", "Your report has been resolved. Both students underwent counseling.", 0}
        }

        For Each r In rows
            Dim daysAgo = CInt(r(6))
            Dim ts = DateTime.Now.AddDays(-daysAgo)
            Dim msg = CStr(r(10))
            Exec(conn, tx,
                "INSERT INTO Incidents (ownerId, incidentType, status, urgencyLevel, contactInfo, description, incidentDate, " &
                "location, timestamp, email, attachments, message, lastMessageTimestamp, isManualMessage, isDeleted) VALUES " &
                "(@id,@type,@status,@urg,@contact,@desc,@idate,@loc,@ts,@email,@att,@msg,@mts,@im,0)",
                P("@id", CStr(r(0))), P("@type", CStr(r(1))), P("@status", CStr(r(2))), P("@urg", CStr(r(3))),
                P("@contact", CStr(r(4))), P("@desc", CStr(r(5))), P("@idate", ts.ToString("yyyy-MM-dd")),
                P("@loc", CStr(r(7))), P("@ts", ts.ToString("yyyy-MM-dd HH:mm:ss")), P("@email", CStr(r(8))),
                P("@att", CStr(r(9))),
                P("@msg", If(String.IsNullOrEmpty(msg), CObj(DBNull.Value), msg)),
                P("@mts", If(String.IsNullOrEmpty(msg), CObj(DBNull.Value), ts.AddHours(2).ToString("yyyy-MM-dd HH:mm:ss"))),
                P("@im", CInt(r(11))))
        Next
    End Sub

    ' ------------------------------------------------------------------ helpers

    Private Function P(name As String, value As Object) As SqliteParameter
        Return New SqliteParameter(name, If(value, DBNull.Value))
    End Function

    Private Sub Exec(conn As SqliteConnection, tx As SqliteTransaction, sql As String, ParamArray params As SqliteParameter())
        Using cmd As New SqliteCommand(sql, conn, tx)
            If params IsNot Nothing Then
                For Each pr In params
                    cmd.Parameters.Add(pr)
                Next
            End If
            cmd.ExecuteNonQuery()
        End Using
    End Sub

End Module
