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
    logout,
    loginMutation,
    registerMutation,
  }
}

export default useAuth
