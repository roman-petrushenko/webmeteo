import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  // Зверніть увагу: ми більше не викликаємо setAuthError з AuthContext безпосередньо з цього компонента для очищення.
  // Очищення authError тепер відбувається в AuthContext перед новим запитом або при виході.
  const { login, register, isLoggedIn, authError, isLoadingAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Локальний стан ТІЛЬКИ для помилок валідації на стороні клієнта (в цій формі)
  const [clientSideError, setClientSideError] = useState(null);

  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', passwordConfirm: '' });

  // Перенаправлення, якщо користувач вже увійшов
  useEffect(() => {
    if (isLoggedIn) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, location.state]);

  // Очищаємо ЛОКАЛЬНІ clientSideError при зміні вкладки (Вхід/Реєстрація)
  useEffect(() => {
    setClientSideError(null);
  }, [isLoginView]);


  const handleLoginChange = (e) => {
    setLoginCredentials({ ...loginCredentials, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setClientSideError(null); // Очищаємо локальні помилки перед спробою
    // Функція login з AuthContext сама очистить authError перед запитом і встановить новий, якщо буде помилка.
    await login(loginCredentials);
    // Компонент перерендериться, і якщо authError в контексті встановлено, він відобразиться.
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setClientSideError(null); // Очищаємо локальні помилки

    if (registerData.password !== registerData.passwordConfirm) {
      setClientSideError("Паролі не співпадають."); // Встановлюємо локальну помилку
      return;
    }
    const { username, email, password } = registerData;
    // Функція register з AuthContext сама очистить authError і встановить новий, якщо буде помилка.
    await register({ username, email, password });
  };
  
  // Для налагодження (можна прибрати після перевірки)
  // useEffect(() => {
  //   console.log("AuthPage Рендер: clientSideError:", clientSideError, "| authError (з контексту):", authError);
  // });


  if (isLoggedIn && !isLoadingAuth) { // Якщо вже залогінені і не йде перевірка, не рендеримо форму
    return null; 
  }

  return (
    <div className="auth-main-container">
        <div className="auth-container">
            <div className="form-toggle">
                <button 
                    onClick={() => setIsLoginView(true)} 
                    className={isLoginView ? 'active' : ''}
                >
                    Вхід
                </button>
                <button 
                    onClick={() => setIsLoginView(false)} 
                    className={!isLoginView ? 'active' : ''}
                >
                    Реєстрація
                </button>
            </div>
            
            {/* Блок для відображення помилок */}
            {/* Спочатку показуємо clientSideError, якщо він є. Якщо ні, то authError з контексту. */}
            {(clientSideError || authError) && (
                <p className="form-message error">
                    {clientSideError || authError}
                </p>
            )}

            {isLoginView ? (
                <form id="loginForm" className="auth-form" onSubmit={handleLoginSubmit}>
                    <h2>Вхід в систему</h2>
                    <div className="form-group">
                        <label htmlFor="loginUsername">Ім'я користувача:</label>
                        <input type="text" id="loginUsername" name="username" value={loginCredentials.username} onChange={handleLoginChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="loginPassword">Пароль:</label>
                        <input type="password" id="loginPassword" name="password" value={loginCredentials.password} onChange={handleLoginChange} required />
                    </div>
                    <button type="submit" disabled={isLoadingAuth}>
                        {isLoadingAuth && isLoginView ? 'Вхід...' : 'Увійти'}
                    </button>
                </form>
            ) : (
                <form id="registerForm" className="auth-form" onSubmit={handleRegisterSubmit}>
                    <h2>Реєстрація</h2>
                    <div className="form-group">
                        <label htmlFor="registerUsername">Ім'я користувача:</label>
                        <input type="text" id="registerUsername" name="username" value={registerData.username} onChange={handleRegisterChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="registerEmail">Email:</label>
                        <input type="email" id="registerEmail" name="email" value={registerData.email} onChange={handleRegisterChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="registerPassword">Пароль (мін. 6 символів):</label>
                        <input type="password" id="registerPassword" name="password" value={registerData.password} onChange={handleRegisterChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="registerPasswordConfirm">Підтвердіть пароль:</label>
                        <input type="password" id="registerPasswordConfirm" name="passwordConfirm" value={registerData.passwordConfirm} onChange={handleRegisterChange} required />
                    </div>
                    <button type="submit" disabled={isLoadingAuth}>
                         {isLoadingAuth && !isLoginView ? 'Реєстрація...' : 'Зареєструватися'}
                    </button>
                </form>
            )}
        </div>
    </div>
  );
}

export default AuthPage;