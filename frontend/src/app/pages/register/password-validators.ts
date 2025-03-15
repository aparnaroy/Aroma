import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms"
import { Config } from "../../config";

export const passwordMatchValidator = function (): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const password = control.get('password');
        const confirmPassword = control.get('password2');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            return { 'passwordMismatch': true };
        }
        return null;
    };
}

export function isValidLength(value: string): boolean {
    return value.length >= Config.minPasswordLength;
}

export function hasUppercaseAndLowercase(value: string): boolean {
    return /[A-Z]/.test(value) && /[a-z]/.test(value);
}

export function hasNumber(value: string): boolean {
    return /[0-9]/.test(value);
}

export function hasSpecialCharacter(value: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
}

export const PasswordStrengthValidator = function (control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    if (!isValidLength(value)) {
        return { passwordStrength: `Password must be at least ${Config.minPasswordLength} characters long` };
    }
    if (!hasUppercaseAndLowercase(value)) {
        return { passwordStrength: `Password must contain both uppercase and lowercase letters` };
    }
    if (!hasNumber(value)) {
        return { passwordStrength: `Password must contain at least one number` };
    }
    if (!hasSpecialCharacter(value)) {
        return { passwordStrength: `Password must contain at least one special character` };
    }
    return null;
};
