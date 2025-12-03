import { ForgotPasswordForm } from './forgot-password-form'

export const metadata = {
  title: 'Forgot Password | AppDistillery',
  description: 'Reset your AppDistillery account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
