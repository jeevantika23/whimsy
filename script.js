// User behavior tracking
const behaviorTracker = {
    typingSpeed: [],
    mouseMovements: [],
    clickPattern: [],
    startTime: Date.now(),
    lastKeyTime: 0,
    totalLoginTime: 0,
    
    // Store behavior profile in localStorage
    storeBehaviorProfile: function(email) {
      const metrics = {
        typingSpeed: this.typingSpeed,
        mouseMovements: this.mouseMovements,
        clickPattern: this.clickPattern,
        totalLoginTime: this.totalLoginTime
      };
      localStorage.setItem(`behavior_${email}`, JSON.stringify(metrics));
    },
    
    // Get stored behavior profile
    getBehaviorProfile: function(email) {
      const profile = localStorage.getItem(`behavior_${email}`);
      return profile ? JSON.parse(profile) : null;
    },
    
    // Calculate similarity score between current behavior and stored profile
    calculateSimilarityScore: function(current, stored) {
      // Simple scoring algorithm (0-100)
      let score = 100;
      
      // Compare typing speed patterns
      const typingSpeedDiff = this.compareMeans(current.typingSpeed, stored.typingSpeed);
      score -= Math.min(30, typingSpeedDiff * 10); // Max 30 points deduction
      
      // Compare login duration
      const timeDiff = Math.abs(current.totalLoginTime - stored.totalLoginTime);
      score -= Math.min(30, (timeDiff / stored.totalLoginTime) * 100); // Max 30 points deduction
      
      // Compare mouse movement patterns (simplified)
      score -= Math.min(40, this.compareMousePatterns(current.mouseMovements, stored.mouseMovements)); // Max 40 points
      
      return Math.max(0, score);
    },
    
    // Helper function to compare means of two arrays
    compareMeans: function(arr1, arr2) {
      if (!arr1.length || !arr2.length) return 1;
      const mean1 = arr1.reduce((sum, val) => sum + val, 0) / arr1.length || 0;
      const mean2 = arr2.reduce((sum, val) => sum + val, 0) / arr2.length || 0;
      return Math.abs(mean1 - mean2) / Math.max(mean1, mean2, 1);
    },
    
    // Helper function to compare mouse movement patterns
    compareMousePatterns: function(movements1, movements2) {
      // Simplified comparison - in a real app, this would be more sophisticated
      if (!movements1.length || !movements2.length) return 40;
      const countDiff = Math.abs(movements1.length - movements2.length) / 
                        Math.max(movements1.length, movements2.length, 1);
      return countDiff * 40; // Scale to max 40 points
    },
    
    // Reset tracking for new login attempt
    reset: function() {
      this.typingSpeed = [];
      this.mouseMovements = [];
      this.clickPattern = [];
      this.startTime = Date.now();
      this.lastKeyTime = 0;
      this.totalLoginTime = 0;
    }
  };
  // Check if we're on the login page
const isLoginPage = !window.location.pathname.includes('dashboard.html');

// Page-specific initialization
if (isLoginPage) {
  initLoginPage();
} else {
  initDashboardPage();
}

// Toast notification system
function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}
function initLoginPage() {
    // DOM elements for login page
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const trainingModeToggle = document.getElementById('trainingModeToggle');
    const securityLevelInput = document.getElementById('securityLevel');
    const securityValueDisplay = document.getElementById('securityValue');
  
    // State variables
    let isTrainingMode = false;
    let securityLevel = 75;
  
    // Track mouse movements
    document.addEventListener('mousemove', (e) => {
      behaviorTracker.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    });
  
    // Track clicks
    document.addEventListener('click', (e) => {
      behaviorTracker.clickPattern.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    });
  
    // Track typing speed
    function trackTyping() {
      const now = Date.now();
      if (behaviorTracker.lastKeyTime > 0) {
        const timeBetweenKeys = now - behaviorTracker.lastKeyTime;
        behaviorTracker.typingSpeed.push(timeBetweenKeys);
      }
      behaviorTracker.lastKeyTime = now;
    }
  
    emailInput.addEventListener('keydown', trackTyping);
    emailInput.addEventListener('keyup', trackTyping);
    passwordInput.addEventListener('keydown', trackTyping);
    passwordInput.addEventListener('keyup', trackTyping);
  
    // Toggle password visibility
    togglePasswordButton.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordButton.textContent = '🔒';
      } else {
        passwordInput.type = 'password';
        togglePasswordButton.textContent = '👁️';
      }
    });
  
    // Toggle training mode
    trainingModeToggle.addEventListener('click', () => {
      isTrainingMode = !isTrainingMode;
      trainingModeToggle.textContent = isTrainingMode 
        ? 'Training Mode: ON' 
        : 'Training Mode: OFF';
      
      showToast(isTrainingMode 
        ? 'Training mode: Your behavior will be recorded as reference' 
        : 'Verification mode: Your behavior will be verified against reference',
        'info');
    });
  
    // Update security level
    securityLevelInput.addEventListener('input', () => {
      securityLevel = securityLevelInput.value;
      securityValueDisplay.textContent = `${securityLevel}%`;
    });
  
    // Mock user database (in real app, this would be server-side)
    const userDatabase = {
      'user@example.com': {
        password: 'password123',
        name: 'Test User'
      }
    };
  
    // Login form submission
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = emailInput.value;
      const password = passwordInput.value;
      
      // Complete behavior metrics
      behaviorTracker.totalLoginTime = Date.now() - behaviorTracker.startTime;
      
      // Basic validation
      if (!email) {
        showToast('Email is required', 'error');
        return;
      }
      
      if (!password) {
        showToast('Password is required', 'error');
        return;
      }
      
      // Check if user exists (mock authentication)
      const user = userDatabase[email];
      if (!user || user.password !== password) {
        showToast('Invalid email or password', 'error');
        return;
      }
      
      // Store user information for dashboard
      const userData = {
        email: email,
        name: user.name,
        lastLogin: new Date().toISOString(),
        loginCount: parseInt(localStorage.getItem(`loginCount_${email}`) || '0') + 1
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem(`loginCount_${email}`, userData.loginCount.toString());
      
      // Training mode: store behavior
      if (isTrainingMode) {
        behaviorTracker.storeBehaviorProfile(email);
        showToast('Login successful and behavior profile saved!', 'success');
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } 
      // Verification mode: verify behavior against stored profile
      else {
        const storedProfile = behaviorTracker.getBehaviorProfile(email);
        
        if (!storedProfile) {
          showToast('No behavior profile found. Please use training mode first.', 'warning');
          // Still log in normally
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
          return;
        }
        
        const similarityScore = behaviorTracker.calculateSimilarityScore(
          {
            typingSpeed: behaviorTracker.typingSpeed,
            mouseMovements: behaviorTracker.mouseMovements,
            clickPattern: behaviorTracker.clickPattern,
            totalLoginTime: behaviorTracker.totalLoginTime
          }, 
          storedProfile
        );
        
        console.log("Behavior similarity score:", similarityScore);
        
        // Save the security score for dashboard display
        localStorage.setItem(`securityScore_${email}`, Math.round(similarityScore).toString());
        
        if (similarityScore >= securityLevel) {
          // Behavior matches, proceed with login
          showToast('Behavior verification passed!', 'success');
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        } else {
          // Behavior doesn't match
          showToast(`Security alert: Unusual login behavior detected (score: ${Math.round(similarityScore)})`, 'error');
        }
      }
      
      // Reset behavior tracking for next login attempt
      behaviorTracker.reset();
    });
  
    // Initialize behavior tracker
    behaviorTracker.reset();
  }
  
  function initDashboardPage() {
    // Get DOM elements
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const securityScoreElement = document.getElementById('securityScore');
    const loginCountElement = document.getElementById('loginCount');
    const lastLoginElement = document.getElementById('lastLogin');
    
    // Check if user is logged in
    const currentUserString = localStorage.getItem('currentUser');
    if (!currentUserString) {
      // If no user is logged in, redirect back to login page
      window.location.href = "behavioral-login.html";
      return;
    }
    
    // Parse user data
    const currentUser = JSON.parse(currentUserString);
    
    // Update welcome message
    welcomeMessage.textContent = `Welcome back, ${currentUser.name || currentUser.email}!`;
    
    // Update stats
    const securityScore = localStorage.getItem(`securityScore_${currentUser.email}`) || "N/A";
    securityScoreElement.textContent = securityScore !== "N/A" ? `${securityScore}%` : "N/A";
    
    loginCountElement.textContent = currentUser.loginCount || "1";
    
    // Format the last login time
    const lastLogin = new Date(currentUser.lastLogin);
    const now = new Date();
    const diffMinutes = Math.round((now - lastLogin) / (1000 * 60));
    
    if (diffMinutes < 1) {
      lastLoginElement.textContent = "Just Now";
    } else if (diffMinutes < 60) {
      lastLoginElement.textContent = `${diffMinutes} min ago`;
    } else {
      lastLoginElement.textContent = lastLogin.toLocaleTimeString();
    }
    
    // Handle logout
    logoutButton.addEventListener('click', () => {
      // Clear current user
      localStorage.removeItem('currentUser');
      
      // Show toast message
      showToast('Successfully logged out', 'success');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "behavioral-login.html";
      }, 1500);
    });
  }
  