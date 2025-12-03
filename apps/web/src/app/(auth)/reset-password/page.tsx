import { ResetPasswordForm } from './reset-password-form'

export const metadata = {
  title: 'Reset Password | AppDistillery',
  description: 'Set your new AppDistillery account password',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
