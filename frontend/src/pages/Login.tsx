'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LoginForm>();

  // Load email dari localStorage jika ada
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Simpan email kalau rememberMe dicentang
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(data.email, data.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'error' in error.response.data
      ) {
        // @ts-expect-error: dynamic error shape from backend
        toast.error(error.response.data.error);
      } else {
        toast.error('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
      {' '}
      {/* Updated gradient colors to match RG Vault palette */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fadeIn">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          {' '}
          {/* Updated to RG Vault brand colors and larger size */}
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {' '}
            {/* Larger icon */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">{isRegister ? 'Create account' : 'Sign in to RG Vault'}</h2> {/* Updated title to include RG Vault branding */}
        <p className="text-sm text-slate-600">{isRegister ? 'Get started with your productivity hub' : 'Welcome back to your productivity hub'}</p> {/* Updated description and text color */}
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full animate-slideUp">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-xl rounded-2xl border border-white/20 transition-all duration-300 hover:shadow-2xl">
          {' '}
          {/* Enhanced backdrop blur and border styling */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  {' '}
                  {/* Updated text color */}
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /* Updated colors to match RG Vault palette */
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {' '}
                {/* Updated text color */}
                Email
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /* Updated colors to match RG Vault palette */
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                {' '}
                {/* Updated text color */}
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type="password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /* Updated colors to match RG Vault palette */
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input type="checkbox" {...register('rememberMe')} className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" /> {/* Updated border color */}
                <span className="text-sm text-slate-600">Remember me</span> {/* Updated text color */}
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Forgot password?
              </a>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5" /* Updated gradient colors to match RG Vault brand */
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </div>
                ) : isRegister ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  reset();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
