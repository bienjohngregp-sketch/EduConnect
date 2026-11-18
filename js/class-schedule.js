let editingScheduleId = null;
let currentUserRole = null;

async function loadClassSchedule() {
    const container = document.getElementById("schedule-list");

    try {
        // Check logged-in user
        const { data: authData, error: authError } =
            await supabaseClient.auth.getUser();

        if (authError || !authData.user) {
            window.location.href = "login.html";
            return;
        }

        const user = authData.user;

        currentUserRole = null;

        // Get student profile
        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, role, school_id, section, is_active")
                .eq("id", user.id)
                .single();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        // Check account status
        if (profile.is_active === false) {
            alert("Your account has been deactivated. Please contact your school administrator.");

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";
            return;
        }

        currentUserRole = profile.role;

        if (!profile.school_id) {
            container.textContent = "Your school profile is incomplete.";
            return;
        }

        if (!["student", "teacher", "admin"].includes(profile.role)) {
            container.textContent = "You do not have permission to view schedules.";
            return;
        }

        if (profile.role === "teacher" || profile.role === "admin") {
            document.getElementById("schedule-form-card").hidden = false;

            await loadScheduleFormOptions(profile.school_id);
        }

        // Get schedules for the user's school
        let query = supabaseClient
            .from("class_schedules")
            .select(`
                id,
                subject_id,
                teacher_id,
                section,
                day_of_week,
                start_time,
                end_time,
                room,
                subjects(subject_name),
                profiles!class_schedules_teacher_id_fkey(full_name)
            `)
            .eq("school_id", profile.school_id)
            .order("start_time");

        // Students can only see their own section
        if (profile.role === "student") {
            query = query.eq("section", profile.section);
        }

        const { data: schedules, error: scheduleError } =
            await query;

        if (scheduleError) throw scheduleError;

        displaySchedules(schedules || []);

    } catch (error) {
        console.error("Class Schedule Error:", error);
        container.textContent = "Unable to load class schedules.";
    }
}


async function loadScheduleFormOptions(schoolId) {
    const subjectSelect = document.getElementById("subject_id");
    const teacherSelect = document.getElementById("teacher_id");

    // Load subjects
    const { data: subjects, error: subjectError } =
        await supabaseClient
            .from("subjects")
            .select("id, subject_name")
            .eq("school_id", schoolId)
            .order("subject_name");

    if (subjectError) {
        console.error("Subject Error:", subjectError);
        return;
    }

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.id;
        option.textContent = subject.subject_name;
        subjectSelect.appendChild(option);
    });

    // Load teachers
    const { data: teachers, error: teacherError } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name")
            .eq("school_id", schoolId)
            .in("role", ["teacher", "admin"])
            .order("full_name");

    if (teacherError) {
        console.error("Teacher Error:", teacherError);
        return;
    }

    teachers.forEach(teacher => {
        const option = document.createElement("option");
        option.value = teacher.id;
        option.textContent = teacher.full_name;
        teacherSelect.appendChild(option);
    });
}

    function editClassSchedule(item) {
        editingScheduleId = item.id;

        document.getElementById("subject_id").value =
            item.subject_id;

        document.getElementById("teacher_id").value =
            item.teacher_id;

        document.getElementById("section").value =
            item.section;

        document.getElementById("day_of_week").value =
            item.day_of_week;

        document.getElementById("start_time").value =
            item.start_time.substring(0, 5);

        document.getElementById("end_time").value =
            item.end_time.substring(0, 5);

        document.getElementById("room").value =
            item.room || "";

        document.getElementById("schedule-message").textContent =
            "Editing class schedule. Make your changes and click Save.";

        document.getElementById("schedule-form-card").scrollIntoView({
            behavior: "smooth"
        });
    }

    async function saveClassSchedule(event) {
        event.preventDefault();

    const message = document.getElementById("schedule-message");
    const form = document.getElementById("schedule-form");

    message.textContent = "Saving schedule...";

    try {
        const { data: authData, error: authError } =
            await supabaseClient.auth.getUser();

        if (authError || !authData.user) {
            window.location.href = "login.html";
            return;
        }

        const user = authData.user;

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, school_id, role, is_active")
                .eq("id", user.id)
                .single();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        // Check account status
        if (profile.is_active === false) {
            alert("Your account has been deactivated. Please contact your school administrator.");

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";
            return;
        }

        if (!["teacher", "admin"].includes(profile.role)) {
            throw new Error("Only teachers and admins can create schedules.");
        }

        const schedule = {
            school_id: profile.school_id,
            subject_id: document.getElementById("subject_id").value,
            teacher_id: document.getElementById("teacher_id").value,
            section: document.getElementById("section").value.trim(),
            day_of_week: document.getElementById("day_of_week").value,
            start_time: document.getElementById("start_time").value,
            end_time: document.getElementById("end_time").value,
            room: document.getElementById("room").value.trim() || null
        };

        if (!schedule.subject_id || !schedule.teacher_id ||
            !schedule.section || !schedule.day_of_week ||
            !schedule.start_time || !schedule.end_time) {
            throw new Error("Please complete all required fields.");
        }

        if (schedule.end_time <= schedule.start_time) {
            throw new Error("End time must be later than start time.");
        }

        const wasEditing = editingScheduleId !== null;

        let saveError;

        if (wasEditing) {
            const { error } = await supabaseClient
                .from("class_schedules")
                .update(schedule)
                .eq("id", editingScheduleId);

            saveError = error;

        } else {
            const { error } = await supabaseClient
                .from("class_schedules")
                .insert(schedule);

            saveError = error;
        }

        if (saveError) throw saveError;

        message.textContent = wasEditing
            ? "Class schedule updated successfully!"
            : "Class schedule saved successfully!";

        message.style.color = "green";

        editingScheduleId = null;

        form.reset();
        document.getElementById("section").value = "BSBA MM-1B";

        await loadClassSchedule();

    } catch (error) {
        console.error("Save Schedule Error:", error);
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// Connect the form submit event
document.getElementById("schedule-form").addEventListener(
    "submit",
    saveClassSchedule
);


async function deleteClassSchedule(scheduleId) {
    const confirmed = confirm(
        "Are you sure you want to delete this class schedule?"
    );

    if (!confirmed) return;

    try {
        const { data: { user }, error: authError } =
            await supabaseClient.auth.getUser();

        if (authError || !user) {
            window.location.href = "login.html";
            return;
        }

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("role, is_active")
                .eq("id", user.id)
                .single();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        if (profile.is_active === false) {
            alert("Your account has been deactivated. Please contact your school administrator.");
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        if (!["teacher", "admin"].includes(profile.role)) {
            throw new Error("Only teachers and admins can delete schedules.");
        }

        const { error } = await supabaseClient
            .from("class_schedules")
            .delete()
            .eq("id", scheduleId);

        if (error) throw error;

        alert("Class schedule deleted successfully!");
        await loadClassSchedule();

    } catch (error) {
        console.error("Delete Schedule Error:", error);
        alert("Unable to delete schedule: " + error.message);
    }
}


function displaySchedules(schedules) {
    const container = document.getElementById("schedule-list");

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    container.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "schedule-grid";

    days.forEach(day => {
        const dayCard = document.createElement("div");
        dayCard.className = "day-card";

        const heading = document.createElement("h3");
        heading.textContent = day;

        dayCard.appendChild(heading);

        const daySchedules = schedules.filter(
            item => item.day_of_week === day
        );

        if (daySchedules.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "No classes scheduled.";
            dayCard.appendChild(empty);
        }

        daySchedules.forEach(item => {
            const subject = document.createElement("p");
            subject.textContent =
                item.subjects?.subject_name || "Unknown Subject";

            const teacher = document.createElement("p");
            teacher.textContent =
                "Teacher: " +
                (item.profiles?.full_name || "Not assigned");

            const time = document.createElement("p");
            time.textContent =
                formatTime(item.start_time) +
                " - " +
                formatTime(item.end_time);

            const room = document.createElement("p");
            room.textContent = "Room: " + (item.room || "TBA");

            dayCard.append(subject, teacher, time, room);

            // Edit and Delete buttons for teachers and admins
            if (currentUserRole === "teacher" || currentUserRole === "admin") {

                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.type = "button";
                editButton.style.marginRight = "8px";

                editButton.addEventListener("click", () => {
                    editClassSchedule(item);
                });

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.type = "button";

                deleteButton.addEventListener("click", () => {
                    deleteClassSchedule(item.id);
                });

                dayCard.append(editButton, deleteButton);
            }

            dayCard.append(subject, teacher, time, room);
        });

        grid.appendChild(dayCard);
    });

    container.appendChild(grid);
}

function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

loadClassSchedule();
