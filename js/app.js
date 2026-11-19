
// ======================================
// EDUCONNECT - STUDENT / TEACHER REGISTRATION
// ======================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const accountTypeInput = document.getElementById("accountType");

    const registerButton = document.getElementById("registerButton");
    const registerMessage = document.getElementById("registerMessage");

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const requestedRole = accountTypeInput
            ? accountTypeInput.value
            : "student";

        registerMessage.textContent = "";
        registerMessage.className = "form-message";

        if (fullName.length < 2) {
            showMessage("Please enter your full name.", "error");
            return;
        }

        if (!["student", "teacher"].includes(requestedRole)) {
            showMessage("Please select a valid account type.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage(
                "Password must contain at least 8 characters.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Creating Account...";

        try {

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,
                    password: password,

                    options: {
                        data: {
                            full_name: fullName,
                            requested_role: requestedRole
                        }
                    }

                });

            if (error) {
                throw error;
            }

            if (data.user) {

                if (requestedRole === "teacher") {

                    showMessage(
                        data.session
                            ? "Account created! Your teacher request is pending admin approval. You can log in as a student while waiting."
                            : "Registration successful! Please confirm your email. Your teacher request will be sent for admin approval after account creation.",
                        "success"
                    );

                } else {

                    showMessage(
                        data.session
                            ? "Student account created successfully! You can now log in."
                            : "Registration successful! Please check your email to confirm your account before logging in.",
                        "success"
                    );

                }

                registerForm.reset();

            } else {
                throw new Error("Unable to create your account. Please try again.");
            }

        } catch (error) {

            console.error("Registration error:", error);

            showMessage(
                error.message || "Something went wrong. Please try again.",
                "error"
            );

        } finally {

            registerButton.disabled = false;
            registerButton.textContent = "Create Account";

        }

    });

    function showMessage(message, type) {
        registerMessage.textContent = message;
        registerMessage.className = "form-message " + type;
    }

}
