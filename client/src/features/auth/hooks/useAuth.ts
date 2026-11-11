import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi, type LoginDto, type RegisterDto } from '../api/authApi'

export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, setSession, clearSession } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginDto) => authApi.login(credentials),
    onSuccess: (data) => {
      setSession(data.token, data.user)
      queryClient.invalidateQueries()
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterDto) => authApi.register(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user)
      queryClient.invalidateQueries()
    },
  })

  // Google OAuth mutation
  const googleAuthMutation = useMutation({
    mutationFn: (credentialOrToken: string) => authApi.googleAuth(credentialOrToken),
    onSuccess: (data) => {
      setSession(data.token, data.user)
      queryClient.invalidateQueries()
    },
  })

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) => authApi.verifyOtp(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user)
      queryClient.invalidateQueries()
    },
  })

  // Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: (email: string) => authApi.resendOtp(email),
  })

  // Logout handler
  const logout = () => {
    clearSession()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    googleAuth: googleAuthMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    resendOtp: resendOtpMutation.mutateAsync,
    logout,
    loginMutation,
    registerMutation,
    googleAuthMutation,
    verifyOtpMutation,
    resendOtpMutation,
  }
}

export default useAuth
