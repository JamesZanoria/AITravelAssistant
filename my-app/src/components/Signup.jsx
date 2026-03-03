import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Login.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hasGrouped, setHasGrouped] = useState(false);
  
  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animation for cursor following
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(mouseX, springConfig);
  const cursorYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hasGrouped) {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hasGrouped, mouseX, mouseY]);

  // Trigger grouping animation after initial peek
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasGrouped(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleNameFocus = () => setFocusedField('name');
  const handleEmailFocus = () => setFocusedField('email');
  const handlePasswordFocus = () => setFocusedField('password');
  const handleConfirmPasswordFocus = () => setFocusedField('confirmPassword');
  const handleBlur = () => setFocusedField(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost/login-backend/api/register.php', {
        name,
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        localStorage.setItem('token', response.data.token);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setError(response.data.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost/login-backend/api/google-auth.php';
  };

  // Character component (same as login)
  const Character = ({ color, shape = 'rectangle', size = 'medium' }) => {
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [bodyTransform, setBodyTransform] = useState({ x: 0, y: 0, rotate: 0 });
    const [isStaringAtOthers, setIsStaringAtOthers] = useState(false);
    const charRef = useRef(null);

    // Stare at each other when name or email is typed
    useEffect(() => {
      if ((name.length > 0 || email.length > 0) && !focusedField && !isStaringAtOthers) {
        setIsStaringAtOthers(true);
        setEyePosition({ x: 0, y: 0 });
        
        setTimeout(() => {
          setIsStaringAtOthers(false);
        }, 1000);
      }
    }, [name, email, focusedField]);

    useEffect(() => {
      if (!hasGrouped || isStaringAtOthers) return;

      const unsubscribeX = cursorXSpring.onChange((x) => {
        const unsubscribeY = cursorYSpring.onChange((y) => {
          if (charRef.current) {
            const rect = charRef.current.getBoundingClientRect();
            const charCenterX = rect.left + rect.width / 2;
            const charCenterY = rect.top + rect.height / 2;
            
            const deltaX = x - charCenterX;
            const deltaY = y - charCenterY;
            const angle = Math.atan2(deltaY, deltaX);
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const distance = Math.min(dist / 20, 8);
            
            setEyePosition({
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance
            });

            const bodyDistance = Math.min(dist / 100, 10);
            const rotateAngle = Math.min((deltaX / window.innerWidth) * 15, 12);
            
            setBodyTransform({
              x: Math.cos(angle) * bodyDistance,
              y: Math.sin(angle) * bodyDistance,
              rotate: rotateAngle
            });
          }
        });
        return () => unsubscribeY();
      });

      return () => unsubscribeX();
    }, [hasGrouped, isStaringAtOthers]);

    const sizeClass = size === 'large' ? 'char-large' : size === 'small' ? 'char-small' : 'char-medium';
    const shapeClass = shape === 'semicircle' ? 'shape-semicircle' : shape === 'rectangle' ? 'shape-rectangle' : '';
    
    const getCharacterState = () => {
      if (success) return 'celebrating';
      if ((showPassword && focusedField === 'password') || (showConfirmPassword && focusedField === 'confirmPassword')) return 'looking-away';
      if (error) return 'worried';
      if (focusedField) return 'amazed';
      if (isLoading) return 'loading';
      return 'default';
    };

    const state = getCharacterState();

    return (
      <motion.div
        ref={charRef}
        className={`character ${sizeClass} ${shapeClass} ${state} ${color}`}
        animate={{
          rotate: hasGrouped && state === 'default' ? [-2, 2, -2, 0] : 0
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: hasGrouped && state === 'default' ? Infinity : 0,
            ease: "easeInOut"
          }
        }}
      >
        <motion.div 
          className="char-body"
          animate={state === 'amazed' ? {
            x: [0, 15, 15],
            scale: [1, 1.05, 1.05],
            rotate: [0, 5, 5]
          } : state === 'worried' ? {
            y: [0, -5, 5, -5, 5, 0],
            rotate: [-3, 3, -3, 3, 0],
            scaleY: [1, 0.95, 1.05, 0.95, 1.05, 1]
          } : state === 'loading' ? {
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          } : state === 'celebrating' ? {
            y: [0, -30, 0, -20, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          } : state === 'looking-away' ? {
            rotate: [0, -20, -20],
            x: [0, -15, -15],
            scaleX: [1, 0.9, 0.9]
          } : hasGrouped ? {
            x: bodyTransform.x,
            y: bodyTransform.y,
            rotate: bodyTransform.rotate,
            scaleX: 1 + Math.abs(bodyTransform.rotate) / 200,
            scaleY: 1 - Math.abs(bodyTransform.rotate) / 250
          } : {}}
          transition={{
            duration: state === 'worried' ? 0.5 : state === 'amazed' ? 0.4 : state === 'celebrating' ? 1.5 : state === 'loading' ? 0.5 : 0.3,
            repeat: state === 'loading' || state === 'worried' ? Infinity : 0,
            ease: state === 'looking-away' ? "easeOut" : "easeInOut"
          }}
        >
          <div className="eyes">
            <motion.div 
              className="eye"
              animate={{
                x: eyePosition.x,
                y: eyePosition.y,
                scaleY: state === 'looking-away' && (color === 'purple' || color === 'pink') ? 0.1 : state === 'celebrating' ? [1, 0.2, 1] : 1,
                scale: state === 'amazed' ? [1, 1.3, 1.3] : state === 'worried' ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                duration: 0.1,
                scale: { duration: 0.3, repeat: state === 'amazed' || state === 'worried' ? Infinity : state === 'celebrating' ? 3 : 0 }
              }}
            >
              <div className="pupil" />
            </motion.div>
            <motion.div 
              className="eye"
              animate={{
                x: eyePosition.x,
                y: eyePosition.y,
                scaleY: state === 'looking-away' && (color === 'purple' || color === 'pink') ? 0.1 : state === 'celebrating' ? [1, 0.2, 1] : 1,
                scale: state === 'amazed' ? [1, 1.3, 1.3] : state === 'worried' ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                duration: 0.1,
                scale: { duration: 0.3, repeat: state === 'amazed' || state === 'worried' ? Infinity : state === 'celebrating' ? 3 : 0 }
              }}
            >
              <div className="pupil" />
            </motion.div>
          </div>
          
          <motion.div 
            className="mouth"
            animate={state === 'amazed' ? {
              scaleX: [1, 1.5, 1.5],
              scaleY: [1, 1.3, 1.3],
              y: [0, 3, 3]
            } : state === 'worried' ? {
              scaleY: [1, 0.6, 0.8, 0.6, 0.8, 1],
              width: ['40px', '50px', '45px', '50px', '45px', '40px']
            } : state === 'celebrating' ? {
              scaleX: [1, 1.8, 1.8],
              scaleY: [1, 1.5, 1.5],
              borderRadius: ['0 0 40px 40px', '50%', '50%']
            } : state === 'looking-away' ? {
              scaleX: 0.7,
              scaleY: 0.9
            } : {}}
            transition={{
              duration: state === 'worried' ? 0.5 : 0.3,
              repeat: state === 'worried' ? Infinity : 0
            }}
          />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="enhanced-login-container">
      <div className="background-gradient">
        <motion.div 
          className="gradient-orb orb-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="gradient-orb orb-2"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="login-wrapper">
        <motion.div 
          className="characters-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="char-wrapper purple-wrapper"
            initial={{ y: -300, rotate: 180, opacity: 0 }}
            animate={hasGrouped ? {
              y: 0,
              rotate: 180,
              opacity: 1
            } : {}}
            transition={{
              delay: 0.2,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 12
            }}
          >
            <Character 
              color="purple" 
              shape="rectangle"
              size="large"
            />
          </motion.div>
          
          <motion.div
            className="char-wrapper pink-wrapper"
            initial={{ x: -300, rotate: -90, opacity: 0 }}
            animate={hasGrouped ? {
              x: 0,
              rotate: 0,
              opacity: 1
            } : {}}
            transition={{
              delay: 0.4,
              duration: 1,
              type: "spring",
              stiffness: 80,
              damping: 12
            }}
          >
            <Character 
              color="pink" 
              shape="rectangle"
              size="medium"
            />
          </motion.div>
          
          <motion.div
            className="char-wrapper orange-wrapper"
            initial={{ x: -400, y: 100, opacity: 0 }}
            animate={hasGrouped ? {
              x: 0,
              y: [100, 0, -20, 0],
              opacity: 1
            } : {}}
            transition={{
              delay: 0.6,
              duration: 1.2,
              type: "spring",
              stiffness: 150,
              damping: 10
            }}
          >
            <Character 
              color="orange" 
              shape="semicircle"
              size="large"
            />
          </motion.div>
          
          <motion.div
            className="char-wrapper yellow-wrapper"
            initial={{ scale: 0, opacity: 0 }}
            animate={hasGrouped ? {
              scale: [0, 1.2, 1],
              opacity: 1
            } : {}}
            transition={{
              delay: 0.8,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <Character 
              color="yellow" 
              shape="rectangle"
              size="medium"
            />
          </motion.div>
        </motion.div>

        <div className="form-card">
          <div className="logo-icon">
            <svg viewBox="0 0 100 100" className="logo-svg">
              <path d="M30,50 L50,30 L70,50 L50,40 Z" fill="currentColor"/>
              <circle cx="50" cy="65" r="8" fill="currentColor"/>
            </svg>
          </div>

          <h1>Create account</h1>
          <p className="subtitle">Please fill in your details to sign up</p>

          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={handleNameFocus}
                onBlur={handleBlur}
                required
                placeholder=""
              />
            </div>

            <div className="input-wrapper">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleEmailFocus}
                onBlur={handleBlur}
                required
                placeholder=""
              />
            </div>

            <div className="input-wrapper password-wrapper">
              <label>Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                  onBlur={handleBlur}
                  required
                  placeholder=""
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="input-wrapper password-wrapper">
              <label>Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={handleConfirmPasswordFocus}
                  onBlur={handleBlur}
                  required
                  placeholder=""
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmPassword ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  className="error-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.div>
              )}
              
              {success && (
                <motion.div 
                  className="success-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  Account created successfully! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                'Sign Up'
              )}
            </button>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignup}
            >
              <svg viewBox="0 0 24 24" className="google-logo">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <p className="signup-link">
              Already have an account? <a href="/">Log In</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;