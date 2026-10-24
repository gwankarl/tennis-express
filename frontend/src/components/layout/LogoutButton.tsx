import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { Button } from '../ui/Button'

interface LogoutButtonProps {
  className?: string
}

/** Signs out locally and requests server-side session revocation. */
export default function LogoutButton({ className = '' }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    const requestFailed = await signOut()

    navigate('/login', {
      replace: true,
      state: { logoutRequestFailed: requestFailed },
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
