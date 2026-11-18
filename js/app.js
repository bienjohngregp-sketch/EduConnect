
// ======================================
// EDUCONNECT - STUDENT REGISTRATION
// ======================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const registerButton =
        document.getElementById("registerButton");

    const registerMessage =
        document.getElementById("registerMessage");

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        registerMessage.textContent = "";
        registerMessage.className = "form-message";

        // Validate full name
        if (fullName.length < 2) {
            showMessage("Please enter your full name.", "error");
            return;
        }

        // Validate password
        if (password.length < 8) {
            showMessage(
                "Password must contain at least 8 characters.",
                "error"
            );
            return;
        }

        // Confirm password
        if (password !== confirmPassword) {
            showMessage(
                "Passwords do not match.",
                "error"
            );
            return;
        }

        // Disable button while processing
        registerButton.disabled = true;
        registerButton.textContent = "Creating Account...";

        try {

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,
                    password: password,

                    options: {
                        data: {
                            full_name: fullName
                        }
                    }

                });

            if (error) {
                throw error;
            }

            if (data.session) {

                showMessage(
                    "Account created successfully! You can now log in.",
                    "success"
                );

                registerForm.reset();

            } else {

                showMessage(
                    "Registration successful! Please check your email to confirm your account before logging in.",
                    "success"
                );

                registerForm.reset();

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
