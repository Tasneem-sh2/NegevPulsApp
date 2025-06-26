
export default {
    common: {
      welcome: "🌟 ברוכים הבאים ל",
      appName: "אפליקציית נגב פולס",
      language: "שפה",
      currentLanguage: "עברית",
       letsStart: "בוא נתחיל"
    },
    villages: {
      title: "כפרים לא מוכרים בנגב"
    },
    auth: {
      signIn: "התחברות",
      logout: {
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
        button: 'Login Again',
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
    about: {
      "title": "עלינו",
      "subtitle": "שיפור הגישה לשירותי חירום באמצעות נתונים גאוגרפיים מדויקים",
      "missionTitle": "המשימה שלנו",
      "missionText": "שירותי החירום בישראל מתקשים להגיע לאזורים לא מוכרים...",
      "problemTitle": "הבעיה",
      "problemList": {
        "lackData": "חוסר בנתונים גאוגרפיים מדויקים",
        "delays": "עיכובים בזמני תגובה",
        "limitedInfo": "מידע מוגבל"
      },
      "goalTitle": "המטרה שלנו",
      "goalText": "הפלטפורמה שלנו אוספת ומעלה נתונים גאוגרפיים מדויקים...",
      "howItWorksTitle": "איך זה עובד",
      "step1": "איסוף נתונים: קהילות מקומיות מוסיפות מידע גאוגרפי מדויק.",
      "step2": "בניית בסיס נתונים: המידע מועלה ונשמר במאגר מרכזי.",
      "step3": "גישה לשירותי חירום: שירותי החירום ניגשים למידע לצורך התמצאות מהירה.",
      "visionTitle": "החזון שלנו לעתיד",
      "visionText": "אנו רואים עתיד שבו כל אזור לא מוכר בישראל יהיה מתועד ונגיש...",
      "contactTitle": "צור קשר",
      "contactText": "יש לך שאלות? פנה אלינו ב"
    },
    contactUs: {
      "title": "צור קשר",
      "asraa": {
        "name": "אסראא אל גרגאווי",
        "email": "asraaalgergawi@gmail.com",
        "phone": "0523694162"
      },
      "tasneem": {
        "name": " תסנים שניור",
        "email": "tasnesh@ac.sce.ac.il",
        "phone": "0523694162"
      },
      "somaya": {
        "name": "סומיה אבו סמור",
        "email": "ssomaya252@gmail.com",
        "phone": "0523694162"
      }
    }
    
  };