export default {
  // locales/en.ts
    languages: {
      en: "English",
      ar: "Arabic",
      he: "Hebrew",
    },
    errors: {
      unknownError: "An unknown error occurred" // الترجمة المناسبة لكل لغة
    },
    common: {
      welcome: "🌟 Welcome to",
      appName: "Negev Pulse App",
      language: "Language",
      currentLanguage: "English",
      letsStart:  "Let's Start",
      retry: "Retry",
      readMore: "Read More"
    },
    villages: {
      title: "Unrecognized Villages in the Negev",
      fullDescription: "Unrecognized villages in the Negev are settlements that are not officially recognized by the state, yet they have a rich history and strong communities. These villages face many challenges, including limited access to basic services such as education and healthcare.",
      appDescription: "The Negev Pulse App is designed to improve access to emergency services for unrecognized villages in the Negev. The app provides accurate geographic information, including village locations, access roads, and local services, to ensure that emergency teams can reach quickly and efficiently."
    },
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      continueWithOut: "Continue without account",
      logout: {
        title: "Logout",
        message: "Are you sure you want to logout?",
        button: "Logout",
        confirmTitle: "Confirm Logout",
        confirmMessage: "Are you sure you want to sign out?",
        confirmButton: "Yes, Logout",
        cancelButton: "Cancel",
      },
      login: {
        title: "Sign In",
        email: "Email",
        password: "Password",
        button: "Login",
        noAccount: "Don't have an account? ",
        signupLink: "Sign Up"
      },
      signup: {
        title: "Create Account",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        passwordHint: "Password must contain: 8+ chars, uppercase, lowercase, number, and special character",
        signupButton: "Sign Up",
        creatingAccount: "Creating Account...",
        accountCreated: "Account created successfully!",
        loginText: "Already have an account?",
        loginLink: "Log In",
        errors: {
          nameRequired: "First name and last name are required",
          passwordMismatch: "Passwords do not match",
          passwordComplexity: "Password must contain: 8+ chars, uppercase, lowercase, number, and special character",
          general: "Signup failed",
          noResponse: "No response received from server",
          network: "Network error or server unavailable"
        }
      }
    },
    tabs: {
      home: "Home",
      contact: "Contact",
      about: "About",
      update: "Update",
      map: "Map",
      location: "Location"
    },
    about: {
      title: "About Us",
      subtitle: "Improving emergency access with accurate geographic data",
      missionTitle: "Our Mission",
      missionText: "NegevPulse is a graduation project developed by three fourth-year Software Engineering students at Sami Shamoon College of Engineering. Our mission is to empower marginalized communities in the Negev region through technology.",
      problemTitle: "The Challenges",
      problemList: {
        item1: "Over 35 unrecognized villages exist physically but don't appear on official maps",
        item2: "No reliable digital mapping exists for emergency services, deliveries, or visitors",
        item3: "These villages are visible on satellite imagery but absent from digital maps"
      },
      goalTitle: "Our Solution",
      goalText: "NegevPulse introduces a three-tier crowdsourcing system where residents can map their communities",
      solutionLevels: [
        { level: "Regular Resident", detail: "Can submit landmarks/roads (Vote weight: 1)", icon: "user" },
        { level: "Active Resident", detail: "Verified contributors (Vote weight: 2)", icon: "user-check" },
        { level: "Community Leader", detail: "Local representatives (Vote weight: 4)", icon: "user-tie" }
      ],
      howItWorksTitle: "Verification Process",
      verificationText: "For a landmark/road to be approved, it must meet two criteria:",
      verificationCriteria: [
        "Achieve 5.6 weighted votes (equivalent to 2 Community Leaders + 1 Active Resident)",
        "Maintain 80% approval rate from all voters"
      ],
      techTitle: "Technical Details",
      techText: "Currently available on Android, with future plans for iOS expansion. Inspired by Waze's community features and Google Maps' reliability.",
      visionTitle: "Join Our Movement",
      contactText: "Help us map the unmapped. Contact us at:",
      contactEmail: "negevpulse.support@gmail.com"
    },
    localPage: {
      title: "Local Resident Board",
      communityAlerts: "Community Alerts",
      quickActions: "Quick Actions",
      recentUpdates: "Recent Updates",
      reportIssue: "Report an Issue",
      contactAuthorities: "Contact Authorities",
      alerts: {
        roadConstruction: "New Road Construction",
        townMeeting: "Upcoming Town Meeting",
        waterMaintenance: "Water Maintenance Notice"
      },
      quick_actions: "Quick Actions",
      report_issue: "Report Issue",
      contact_authorities: "Contact Authorities",
      updates: "Recent Updates",
      updatesText: "Latest community news and updates will appear here. Check regularly for important information."
    },
    HomePage: {
      startingPoint: "Starting Point",
      destination: "Destination",
      setStartingPoint: "Set Starting Point",
      setDestination: "Set Destination",
      goToStart: "Go to Start",
      goToDestination: "Go to Destination",
      showRoute: "Show Route",
      loading: "Loading...",
      routeInformation: "Route Information",
      distance: "Distance",
      duration: "Duration",
      enterStartingAddress: "Please enter the starting point address",
      enterDestinationAddress: "Please enter the destination address",
      couldNotFindLocation: "Could not find the location. Try a different address.",
      pleaseSetBothPoints: "Please set both the starting point and destination.",
      failedFetchRoute: "Failed to fetch the route. Try again later.",
      currentLocation: "Current Location",
      startpoint:"Start Point"


    },
    
      landmarks: {
        "algergawiShop": "Algergawi Shop",
        "electricityPole": "Electricity Pole",
        "electricCompany": "Electric Company",
        "azazmaSchool": "Al-Azazma School",
        "algergawiMosque": "Algergawi Mosque",
        "abuSwilimMaterials": "Abu Swilim Building Materials",
        "abuSwilimMosque": "Abu Swilim Mosque",
        "abuMuharibButcher": "Abu Muharib's Butcher Shop",
        "mauhidetClinic": "Mauhidet Clinic",
        "dentalClinic": "General Dental Clinic",
        "electricCompanyEntry": "The Entry of the Electric Company",
        "greenContainer": "The Green Container"
      },
      contactUs: {
        title: 'Contact Us',
        subtitle: 'We are here to help you with any inquiries you may have',
        whatsapp: 'Contact Us via WhatsApp',
        socialMedia: 'Social Media',
        asraa: {
        name: 'Asraa Algergawi',
        email: 'asraaalgergawi@gmail.com',
        phone: '+972523694162',
        role: 'Development Manager'
        },
        tasneem: {
        name: 'Tasneem Sheneour',
        email: 'tasadel2002@gmail.com',
        phone: '+972545993204',
        role: 'Development Manager'
        },
        somaya: {
        name: 'Sumaya Abu Samour',
        email: 'ssomaya252@gmail.com',
        phone: '+972544822959',
        role: 'Manager Development'
        }
      },
      userStatus: {
        superLocal: "SuperLocal Resident",
        superLocalDesc: "You have SuperLocal privileges!",
        activeResident: "Active Resident",
        activeResidentDesc: "You're an active contributor with {count} verified items!",
        regularResident: "Regular Resident",
        regularResidentDesc: "Get started by adding and verifying landmarks/routes"
      },

    stats: {
      landmarks: "Landmarks",
      routes: "Routes",
      correctVotes: "Correct Votes"
    },

    progress: {
      title: "Progress to Next Level",
      verificationsNeeded: "Need {count} more verifications to become Active",
      votesNeeded: "Need {count} more correct votes to become SuperLocal"
    },

    buttons: {
      applySuperLocal: "Apply for SuperLocal",
      addLandmark: "Add Landmark",
      addRoute: "Add Route"
    },

    status: {
      requestPending: "Super Local request pending admin approval"
    },

    alerts: {
      error: "Error",
      success: "Success",
      notAuthenticated: "Not authenticated",
      requestFailed: "Failed to submit request. Please try again.",
      loadUserData: "Failed to load user data. Please check your connection."
    },
    home: {
      startPoint: "Starting Point",
      destination: "Destination",
      setStart: "Set Start",
      setDestination: "Set Destination",
      showRoutes: "Show Routes",
      showRoute: "Show Route",
      startNavigation: "Start Navigation",
      distance: "Distance",
      duration: "Duration",
      navigationSteps: "Navigation Steps",
      previous: "Previous",
      next: "Next",
      currentLocation: "Current Location",
      stopNavigation: "Stop Navigation",
      searchLandmark: "Search landmark...",
      routeInfo: "Route Information",
      routeActions: "Route Actions",
      eta: "ETA",
      startPlaceholder: "Current Location or specific address",
      destinationPlaceholder: "Destination address"

    },
    addLandmark: {
      searchPlaceholder: "Search landmarks...",
      filterAll: "All",
      filterVerified: "Verified",
      filterPending: "Pending",
      pendingLandmarksTitle: "Pending Landmarks",
      LandmarksTitle: "Landmarks On The Map",
      noPendingLandmarks: "No pending landmarks in this area",
      noVerifiedLandmarks: "No verified landmarks in this area",
      noLandmarks: "لا توجد معالم في هذه المنطقة",
      yourLocation: "Your Location",
      verified: "Verified",
      pendingVerification: "Pending Verification",
      showForm: "Show Form",
      minimizeForm: "Minimize Form",
      addLandmarkTitle: "Add New Landmark",
      landmarkTitlePlaceholder: "Landmark title",
      descriptionPlaceholder: "Description (optional)",
      changeImage: "Change Image",
      selectImage: "Select Image (optional)",
      addLandmarkButton: "Add Landmark",
      cancelButton: "Cancel",
      tapToAdd: "Tap on the map to add a landmark",
      helpVerify: "Help Verify",
      isAccurate: "Is this landmark accurate?",
      confirm: "Confirm",
      reject: "Reject",
      validation: {
      nameRequired: "Landmark name is required",
      locationRequired: "Location is required"
      },
      success: "Landmark added successfully!",
      error: "Error adding landmark",
      noNearbyLandmarks: "No nearby landmarks found",
      errors: {
        landmarkNotFound: "Landmark not found",
        outOfRange: "You can only vote on nearby landmarks",
        general: "An error occurred. Please try again",
        auth: "Authentication required. Please login",
        nearbyOnly: "You can only interact with landmarks within your current area"
      },
      common: {
        ok: "ok",
        cancel: "Cancel",
        locationRequired:"Location access is required for this feature",
      errors: {
        landmarkNotFound: "Landmark not found",
        outOfRange: "You can only vote on nearby landmarks",
        general: "An error occurred. Please try again",
        auth: "Authentication required. Please login",
        nearbyOnly:"You can only interact with landmarks within your current area"

      }
      }

    },
    addRoute: {
      route: "Route",
      searchPlaceholder: "Search places...",
      filterAll: "All",
      filterVerified: "Verified",
      filterPending: "Pending",
      pendingRoutesTitle: "Pending Routes",
      noPendingRoutes: "No pending routes in this area",
      noVerifiedRoutes: "No verified routes in this area",
      noRoutes: "No routes in this area",
      yourLocation: "Your location",
      verified: "Verified",
      pendingVerification: "Pending verification",
      showForm: "Show form",
      minimizeForm: "Minimize form",
      addRouteTitle: "Add new route",
      routeTitlePlaceholder: "Route title",
      descriptionPlaceholder: "Description (optional)",
      saveButton: "Save",
      drawRoute: "Draw route",
      cancelDrawing: "Cancel drawing",
      pointsCount: "Points",
      drawingRouteWithPoints: "Drawing route with {count} points",
      distance: "Distance",
      helpVerify: "Help verify",
      isAccurate: "Is this route accurate?",
      confirm: "Confirm",
      reject: "Reject",
      validation: {
        titleRequired: "Route title is required",
        minPoints: "Route must have at least 2 points"
      },
      votedYes: "voted Yes",
      votedNo: "voted No",
      voteNo: " Vote No",
      voteYes: " Vote Yes",
      success: "Route saved successfully!",
      error: "Error saving route",
      tapToAdd: "Tap on the map to add a point",
      km: "km",
      m: "m",
      deleteRoute: " Delete Route",
      close: "Close",
      routeInformation: "Route Information",
      needsTribalReview: "Needs Tribal Review",
      verificationStatus: "Verification Status",
      routeInfo: "Route Information",
      verifiedRoute: "Verified Route",
      cancelButton: "Cancel",
      showRoutes: "show Routes",
      hideRoutes: "Hide Routes",
      points: "Points",
      noPendingRoutesNearby: "No pending routes nearby",
      tooFarToVote: "Too Far to Vote",
      mustBeWithinRadius: "You must be within {radius}m to vote",
      understand: "I Understand",
      minPointsRequired: "Route needs at least 2 points",
      routeTooShort: "Route is too short (minimum 50m)",
      pointsTooClose: "Some points are too close together (minimum 10m apart)",
      invalidRoute: "Invalid Route",
      tapToAddPoints: "Tap to add route points",
      tapToAddMorePoints: "Tap to add more points",
      longPressToDrawFreehand: "Long press and drag to draw freehand"
    },
    admin: {
    title: 'Admin Dashboard',
    logout: 'Logout',
    totalUsers: 'Total Users',
    systemHealth: 'System Health',
    verificationSettings: 'Verification Settings',
    verificationRadius: 'Verification Radius',
    updateRadius: 'Update Radius',
    userManagement: 'User Management',
    viewUsers: 'View Users',
    hideUsers: 'Hide Users',
    createUser: 'Create User',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    superLocal: 'Super Local',
    noUsers: 'No Users',
    refresh: 'Refresh',
    tryAgain: 'Try Again',
    error: 'Error',
    adminRole: 'Admin',
    emergencyRole: 'Emergency',
    localRole: 'Local',
    success: 'Success',
    failed: 'Failed',
    meters: 'm',
    percent: '%',
    yes: 'Yes',
    no: 'No'
  },
  signup: {
    title: "Create Account",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordHint: "Password must contain: 8+ chars, uppercase, lowercase, number, and special character",
    signupButton: "Sign Up",
    creatingAccount: "Creating Account...",
    accountCreated: "Account created successfully!",
    loginText: "Already have an account?",
    loginLink: "Log In",
    errors: {
      nameRequired: "First name and last name are required",
      passwordMismatch: "Passwords do not match",
      passwordComplexity: "Password must contain: 8+ chars, uppercase, lowercase, number, and special character"
    }
  }
  };