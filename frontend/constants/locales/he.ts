export default {
    languages: {
      en: "אנגלית",
      ar: "ערבית",
      he: "עברית",
  },
  errors: {
    unknownError: "אירעה שגיאה לא ידועה" // الترجمة المناسبة لكل لغة 
  },
    common: {
      welcome: "🌟 ברוכים הבאים ל",
      appName: "אפליקציית נגב פולס",
      language: "שפה",
      currentLanguage: "עברית",
      letsStart: "בוא נתחיל",
      retry: "נסה שוב",
      readMore: "קרא עוד"
    },
    villages: {
      title: "כפרים לא מוכרים בנגב",
      fullDescription: "כפרים לא מוכרים בנגב הם יישובים שאינם מוכרים רשמית על ידי המדינה, אך יש להם היסטוריה עשירה וקהילות חזקות. הכפרים הללו מתמודדים עם אתגרים רבים, כולל גישה מוגבלת לשירותים בסיסיים כמו חינוך ובריאות.",
      appDescription: "אפליקציית נגב פולס נועדה לשפר את הגישה לשירותי חירום עבור הכפרים הלא מוכרים בנגב. האפליקציה מספקת מידע גאוגרפי מדויק, כולל מיקומי כפרים, דרכי גישה ושירותים מקומיים, כדי להבטיח שצוותי החירום יוכלו להגיע במהירות וביעילות." 
    },
    auth: {
      signIn: "התחברות",
      logout: {
        title: "התנתקות",
        message: "האם אתה בטוח שברצונך להתנתק?",
        button: "התנתק",
        confirmTitle: "אישור התנתקות",
        confirmMessage: "האם אתה בטוח שברצונך להתנתק?",
        confirmButton: "כן, התנתק",
        cancelButton: "ביטול",
      },// ✅ Add this line
      signUp: "הרשמה",
      login: {
        title: "התחברות",
        email: "אימייל",
        password: "סיסמה",
        button: "התחבר",
        noAccount: "אין לך חשבון? ",
        signupLink: "הרשמה"
      },
      signup: {
        title: "יצירת חשבון",
        name: "שם",
        email: "אימייל",
        password: "סיסמה",
        confirmPassword: "אימות סיסמה",
        roleLocal: "תושב מקומי",
        roleEmergency: "מגיש עזרה ראשונה",
        button: "הרשם",
        passwordMismatch: "הסיסמאות לא תואמות",
        successMessage: "החשבון נוצר בהצלחה",
        loginLink: " התחברות",
        loginPrompt:"כבר יש לך חשבון?",
        roleLabel:"סוג חשבון:",
        unexpectedError:"אירעה שגיאה בלתי צפויה",

      }
    },
    tabs: {
      home: "בית",
      contact: "יצירת קשר",
      about: "אודות",
      update: "עדכון",
      map: "מפה",
      location: "מיקום"
    },
    about: {
      title: "עלינו",
      subtitle: "שיפור הגישה לשירותי חירום באמצעות נתונים גאוגרפיים מדויקים",
      missionTitle: "המשימה שלנו",
      missionText: "נגב פולס הוא פרויקט גמר שפותח על ידי שלוש סטודנטיות להנדסת תוכנה בשנה הרביעית במכללת סמי שמעון להנדסה. המשימה שלנו היא להעצים קהילות מוחלשות באזור הנגב באמצעות טכנולוגיה.",
      problemTitle: "האתגרים",
      problemList: {
        item1: "יותר מ-35 כפרים לא מוכרים קיימים פיזית אך לא מופיעים במפות רשמיות",
        item2: "אין מיפוי דיגיטלי אמין עבור שירותי חירום, משלוחים או מבקרים",
        item3: "כפרים אלה נראים בתמונות לוויין אך נעדרים ממפות דיגיטליות"
      },
      goalTitle: "הפתרון שלנו",
      goalText: "נגב פולס מציג מערכת תלת-שכבתית של מיקור המונים שבה תושבים יכולים למפות את הקהילות שלהם",
      solutionLevels: [
        { level: "תושב רגיל", detail: "יכול להגיש ציוני דרך/כבישים (משקל הצבעה: 1)", icon: "user" },
        { level: "תושב פעיל", detail: "תורמים מאומתים (משקל הצבעה: 2)", icon: "user-check" },
        { level: "מנהיג קהילה", detail: "נציגים מקומיים (משקל הצבעה: 4)", icon: "user-tie" }
      ],
      howItWorksTitle: "תהליך האימות",
      verificationText: "כדי שציון דרך או כביש יאושרו, הם חייבים לעמוד בשני קריטריונים:",
      verificationCriteria: [
        "להשיג 5.6 קולות משוקללים (שווה ערך ל-2 מנהיגי קהילה + תושב פעיל אחד)",
        "לשמור על שיעור אישור של 80% מכלל המצביעים"
      ],
      techTitle: "פרטים טכניים",
      techText: "זמין כעת באנדרואיד, עם תוכניות עתידיות להרחבה ל-iOS. בהשראת תכונות הקהילה של Waze והאמינות של Google Maps.",
      visionTitle: "הצטרפו לתנועה שלנו",
      contactText: "עזרו לנו למפות את הבלתי ממופה. צרו איתנו קשר ב:",
      contactEmail: "negevpulse.support@gmail.com"
    },
    localPage: {
      title: "לוח תושב מקומי",
      communityAlerts: "התראות קהילתיות",
      quickActions: "פעולות מהירות",
      recentUpdates: "עדכונים אחרונים",
      reportIssue: "דווח על תקלה",
      contactAuthorities: "יצירת קשר עם הרשויות",
      alerts: {
        roadConstruction: "בניית כביש חדש",
        townMeeting: "פגישת עירייה קרובה",
        waterMaintenance: "הודעת תחזוקת מים"
      },
      quick_actions: "פעולות מהירות",
      report_issue: "דיווח על בעיה",
      contact_authorities: "צור קשר עם הרשויות",
      updates: "עדכונים אחרונים",
      updatesText: "חדשות ועדכונים קהילתיים עדכניים יופיעו כאן. בדוק באופן קבוע לקבלת מידע חשוב."
    },
    HomePage: {
      startingPoint: "נקודת התחלה",
      destination: "יעד",
      setStartingPoint: "הגדר נקודת התחלה",
      setDestination: "הגדר יעד",
      goToStart: "עבור לנקודת ההתחלה",
      goToDestination: "עבור ליעד",
      showRoute: "הצג מסלול",
      loading: "טוען...",
      routeInformation: "פרטי המסלול",
      distance: "מרחק",
      duration: "משך זמן",
      enterStartingAddress: "אנא הזן את כתובת נקודת ההתחלה",
      enterDestinationAddress: "אנא הזן את כתובת היעד",
      couldNotFindLocation: "לא ניתן היה למצוא את המיקום. נסה כתובת אחרת.",
      pleaseSetBothPoints: "אנא הגדר גם את נקודת ההתחלה וגם את היעד.",
      failedFetchRoute: "נכשל באחזור המסלול. נסה שוב מאוחר יותר.",
      currentLocation: "מיקום נוכחי",
      startpoint:" נקודת ההתחלה"


    },
    landmarks: {
      "algergawiShop": "חנות אלג'רגאווי",
      "electricityPole": "עמוד חשמל",
      "electricCompany": "חברת החשמל",
      "azazmaSchool": "בית ספר אלעזאזמה",
      "algergawiMosque": "מסגד אלג'רגאווי",
      "abuSwilimMaterials": "חומרי בניין אבו סווילים",
      "abuSwilimMosque": "מסגד אבו סווילים",
      "abuMuharibButcher": "אטליז אבו מחרב",
      "mauhidetClinic": "מרפאת מאוחד",
      "dentalClinic": "מרפאת שיניים כללית",
      "electricCompanyEntry": "כניסה לחברת החשמל",
      "greenContainer": "המיכל הירוק"
    },
    contactUs: {
      title: 'צור קשר',
      subtitle: 'אנחנו כאן כדי לעזור לך עם כל שאלה',
      whatsapp: 'צור קשר דרך וואטסאפ',
      socialMedia: 'מדיה חברתית',
      asraa: {
        name: 'אסראא אלגרגאוי',
        email: 'asraaalgergawi@gmail.com',
        phone: '+972523694162',
        role: 'מנהלת פיתוח'
      },
      tasneem: {
        name: 'תסנים שניור',
        email: 'tasadel2002@gmail.com',
        phone: '+972545993204',
        role: 'מנהלת פיתוח'
      },
      somaya: {
        name: 'סומאיה אבו סמור',
        email: 'ssomaya252@gmail.com',
        phone: '+966501234569',
        role: 'מנהלת פיתוח'
      }
    },
      userStatus: {
    superLocal: "תושב סופר מקומי",
    superLocalDesc: "יש לך הרשאות של תושב סופר מקומי!",
    activeResident: "תושב פעיל",
    activeResidentDesc: "אתה תורם פעיל עם {count} פריטים מאומתים!",
    regularResident: "תושב רגיל",
    regularResidentDesc: "התחל על ידי הוספה ואימות ציוני דרך ומסלולים"
  },

  stats: {
    landmarks: "ציוני דרך",
    routes: "מסלולים",
    correctVotes: "הצבעות נכונות"
  },

  progress: {
    title: "התקדמות לרמה הבאה",
    verificationsNeeded: "נדרשים {count} אימותים נוספים כדי להפוך לתושב פעיל",
    votesNeeded: "נדרשים {count} הצבעות נכונות נוספות כדי להפוך לסופר מקומי"
  },

  buttons: {
    applySuperLocal: "הגשת בקשה לסופר מקומי",
    addLandmark: "הוסף ציון דרך",
    addRoute: "הוסף מסלול"
  },

  status: {
    requestPending: "בקשת סופר מקומי ממתינה לאישור המנהל"
  },

  alerts: {
    error: "שגיאה",
    success: "הצלחה",
    notAuthenticated: "לא מאומת",
    requestFailed: "שליחת הבקשה נכשלה. אנא נסה שוב.",
    loadUserData: "טעינת נתוני המשתמש נכשלה. אנא בדוק את החיבור שלך."
  },
  home: {
      startPoint: "נקודת התחלה",
      destination: "יעד",
      setStart: "הגדר התחלה",
      setDestination: "הגדר יעד",
      showRoutes: "Show Routes",
      showRoute: "הצג מסלול",
      startNavigation: "התחל ניווט",
      distance: "מרחק",
      duration: "משך זמן",
      navigationSteps: "צעדי ניווט",
      previous: "קודם",
      next: "הבא",
      currentLocation: "מיקום נוכחי",
      stopNavigation: "עצור ניווט",
      searchLandmark: "חפש ציון דרך...",
      routeInfo: "מידע על מסלול",
      routeActions: "פעולות מסלול",
      eta: "זמן הגעה משוער",
      startPlaceholder: "מיקום נוכחי או כתובת ספציפית",
      destinationPlaceholder: "כתובת היעד"
    },
    addLandmark: {
      searchPlaceholder: "חפש ציוני דרך...",
      filterAll: "הכל",
      filterVerified: "מאומת",
      filterPending: "ממתין",
      pendingLandmarksTitle: "ציוני דרך ממתינים",
      noPendingLandmarks: "אין ציוני דרך ממתינים באזור זה",
      yourLocation: "המיקום שלך",
      verified: "מאומת",
      pendingVerification: "ממתין לאימות",
      showForm: "הצג טופס",
      minimizeForm: "מזער טופס",
      addLandmarkTitle: "הוסף ציון דרך חדש",
      landmarkTitlePlaceholder: "שם ציון הדרך",
      descriptionPlaceholder: "תיאור (אופציונלי)",
      changeImage: "שנה תמונה",
      selectImage: "בחר תמונה (אופציונלי)",
      addLandmarkButton: "הוסף ציון דרך",
      cancelButton: "בטל",
      tapToAdd: "הקש על המפה כדי להוסיף ציון דרך",
      helpVerify: "עזרה באימות",
      isAccurate: "האם ציון הדרך הזה מדויק?",
      confirm: "אשר",
      reject: "דחה",
       validation: {
      nameRequired: "נדרש שם ציון דרך",
      locationRequired: "נדרש מיקום"
      },
      success: "ציון דרך נוסף בהצלחה!",
      error: "שגיאה בהוספת ציון דרך"
    },
    addRoute: {
      route: "מסלול",
      searchPlaceholder: "חפש מקומות...",
      filterAll: "הכל",
      filterVerified: "מאומת",
      filterPending: "ממתין",
      pendingRoutesTitle: "מסלולים ממתינים",
      noPendingRoutes: "אין מסלולים ממתינים",
      yourLocation: "המיקום שלך",
      verified: "מאומת",
      pendingVerification: "ממתין לאימות",
      showForm: "הצג טופס",
      minimizeForm: "מזער טופס",
      addRouteTitle: "הוסף מסלול חדש",
      routeTitlePlaceholder: "שם המסלול",
      descriptionPlaceholder: "תיאור (אופציונלי)",
      saveButton: "שמור",
      drawRoute: "צייר מסלול",
      cancelDrawing: "בטל ציור",
      drawingRouteWithPoints: "ציור מסלול עם {count} נקודות",
      pointsCount: "מספר נקודות",
      distance: "מרחק",
      helpVerify: "עזרה באימות",
      isAccurate: "האם המסלול הזה מדויק?",
      confirm: "אשר",
      reject: "דחה",
      validation: {
        titleRequired: "נדרש שם מסלול",
        minPoints: "המסלול חייב לכלול לפחות שתי נקודות"
      },
      votedYes: "צבע בנכן",
      votedNo: "צבע לא",
      voteNo: "הצבע לא",
      voteYes: "הצבע כן",
      success: "המסלול נשמר בהצלחה!",
      error: "שגיאה בשמירת המסלול",
      tapToAdd: "הקש על המפה כדי להוסיף נקודה",
      km: "ק״מ",
      m: "מ׳",
      deleteRoute: " מחק מסלול",
      close: "סגור",
      routeInformation: "מידע על מסלול",
      needsTribalReview: "נדרש סקירה שבטית",
      verificationStatus: "סטטוס אימות"
    },
      admin: {
    title: 'לוח בקרה למנהל',
    logout: 'התנתק',
    totalUsers: 'סה"כ משתמשים',
    systemHealth: 'בריאות המערכת',
    verificationSettings: 'הגדרות אימות',
    verificationRadius: 'רדיוס אימות',
    updateRadius: 'עדכן רדיוס',
    userManagement: 'ניהול משתמשים',
    viewUsers: 'הצג משתמשים',
    hideUsers: 'הסתר משתמשים',
    createUser: 'צור משתמש',
    name: 'שם',
    email: 'אימייל',
    role: 'תפקיד',
    superLocal: 'סופר מקומי',
    noUsers: 'אין משתמשים',
    refresh: 'רענן',
    tryAgain: 'נסה שוב',
    error: 'שגיאה',
    adminRole: 'מנהל',
    emergencyRole: 'חירום',
    localRole: 'מקומי',
    success: 'הצלחה',
    failed: 'נכשל',
    meters: 'מטר',
    percent: '%',
    yes: 'כן',
    no: 'לא'
  }
    
    
  };