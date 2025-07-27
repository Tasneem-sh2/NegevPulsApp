export default {
    languages: {
      en: "الإنجليزية",
      ar: "العربية",
      he: "العبرية",
    },
    common: {
      welcome: "🌟 مرحبًا بكم في",
      appName: "تطبيق نبض النقب",
      language: "اللغة",
      currentLanguage: "العربية",
      letsStart: "لنبدأ",
      retry: "إعادة المحاولة",
      readMore: "اقرأ المزيد"
    },
    villages: {
      title: "القرى غير المعترف بها في النقب",
      fullDescription: "القرى غير المعترف بها في النقب هي مستوطنات غير معترف بها رسميًا من قبل الدولة، لكنها تتمتع بتاريخ غني ومجتمعات قوية. تواجه هذه القرى العديد من التحديات، بما في ذلك الوصول المحدود إلى الخدمات الأساسية مثل التعليم والرعاية الصحية. يهدف تطبيق نبض النقب إلى تحسين الوصول إلى خدمات الطوارئ لهذه المجتمعات من خلال توفير معلومات جغرافية دقيقة.",
      appDescription: "تم تصميم تطبيق نبض النقب لتحسين الوصول إلى خدمات الطوارئ للقرى غير المعترف بها في النقب. يوفر التطبيق معلومات جغرافية دقيقة، بما في ذلك مواقع القرى وطرق الوصول والخدمات المحلية، لضمان وصول فرق الطوارئ بسرعة وكفاءة."
    },
    errors: {
      unknownError: "خطأ غير معروف. يرجى المحاولة مرة أخرى.",
      unexpectedError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا.",
      networkError: "خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.",
      invalidInput: "مدخلات غير صالحة. يرجى التحقق من المعلومات"
      },
    auth: {
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      logout:{
        title: "تسجيل الخروج",
        message: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
        button: "خروج",
        confirmTitle: "تأكيد تسجيل الخروج",
        confirmMessage: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
        confirmButton: "نعم، تسجيل الخروج",
        cancelButton: "إلغاء",
      } , // ✅ Add this line
      login: {
        title: "تسجيل الدخول",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        button: "دخول",
        noAccount: "ليس لديك حساب؟ ",
        signupLink: "إنشاء حساب"
      },
      signup: {
        title: "إنشاء حساب",
        name: "الاسم",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
        roleLocal: "مقيم محلي",
        roleEmergency: "مسعف",
        button: "تسجيل",
        passwordMismatch: "كلمات المرور غير متطابقة",
        successMessage: "تم إنشاء الحساب بنجاح	",
        loginLink:"تسجيل الدخول	",
        loginPrompt:"هل لديك حساب بالفعل؟	",
        roleLabel:"نوع الحساب:	",
        unexpectedError:"حدث خطأ غير متوقع	 ",
      }
    },
    tabs: {
      home: "الرئيسية",
      contact: "اتصل بنا",
      about: "حول",
      update: "تحديث",
      map: "الخريطة",
      location: "الموقع"
    },
    about: {
      title: "من نحن",
      subtitle: "تحسين الوصول في حالات الطوارئ من خلال بيانات جغرافية دقيقة",
      missionTitle: "مهمتنا",
      missionText: "نبض النقب هو مشروع تخرج طوّره ثلاثة طالبات في السنة الرابعة من قسم هندسة البرمجيات في كلية سامي شمعون للهندسة. مهمتنا هي تمكين المجتمعات المهمّشة في منطقة النقب من خلال التكنولوجيا.",
      problemTitle: "التحديات",
      problemList: {
        item1: "يوجد أكثر من 35 قرية غير معترف بها فعليًا ولكنها لا تظهر على الخرائط الرسمية",
        item2: "لا توجد خرائط رقمية موثوقة لخدمات الطوارئ أو عمليات التسليم أو الزوار",
        item3: "تظهر هذه القرى على صور الأقمار الصناعية ولكنها غائبة عن الخرائط الرقمية"
      },
      goalTitle: "حلنا",
      goalText: "نبض النقب يقدم نظام تعهيد جماعي ثلاثي المستويات حيث يمكن للمقيمين رسم مجتمعاتهم",
      solutionLevels: [
        { level: "مواطن عادي", detail: "يمكنه إضافة معالم/طرق (وزن الصوت: 1)", icon: "user" },
        { level: "مواطن نشط", detail: "مساهمون موثوق بهم (وزن الصوت: 2)", icon: "user-check" },
        { level: "قادة مجتمع", detail: "ممثلو المجتمع (وزن الصوت: 4)", icon: "user-tie" }
      ],
      howItWorksTitle: "عملية التحقق",
      verificationText: "لنتمكن من اعتماد معلم أو طريق، يجب أن يستوفي معيارين:",
      verificationCriteria: [
        "الحصول على 5.6 أصوات مرجحة (ما يعادل صوتين من قادة المجتمع وصوت واحد من مواطن نشط)",
        "الحفاظ على معدل موافقة 80% من جميع الناخبين"
      ],
      techTitle: "تفاصيل تقنية",
      techText: "التطبيق متاح حاليًا على أندرويد، مع خطط مستقبلية للتوسع إلى iOS. مستوحى من أفضل ميزات المجتمع في Waze وموثوقية خرائط جوجل.",
      visionTitle: "انضم إلى حركتنا",
      contactText: "ساعدنا في رسم الخرائط للمناطق غير المرسومة. تواصل معنا على:",
      contactEmail: "negevpulse.support@gmail.com"
    },

    localPage: {
      title: "لوحة المقيم المحلي",
      communityAlerts: "تنبيهات المجتمع",
      quickActions: "إجراءات سريعة",
      recentUpdates: "التحديثات الأخيرة",
      reportIssue: "الإبلاغ عن مشكلة",
      contactAuthorities: "الاتصال بالسلطات",
      alerts: {
        roadConstruction: "إنشاء طريق جديد",
        townMeeting: "اجتماع بلدي قادم",
        waterMaintenance: "إشعار صيانة المياه"
      },
      quick_actions: "إجراءات سريعة",
      report_issue: "الإبلاغ عن مشكلة",
      contact_authorities: "الاتصال بالسلطات",
      updates: "آخر التحديثات",
      updatesText: "أحدث الأخبار والتحديثات المجتمعية ستظهر هنا. تحقق بانتظام للحصول على معلومات مهمة."
    },
    HomePage:{
      startingPoint: "نقطة البداية",
      destination: "الوجهة",
      setStartingPoint: "تعيين نقطة البداية",
      setDestination: "تعيين الوجهة",
      goToStart: "اذهب إلى البداية",
      goToDestination: "اذهب إلى الوجهة",
      showRoute: "عرض المسار",
      loading: "جارٍ التحميل...",
      routeInformation: "معلومات المسار",
      distance: "المسافة",
      duration: "المدة الزمنية",
      enterStartingAddress: "يرجى إدخال عنوان نقطة البداية",
      enterDestinationAddress: "يرجى إدخال عنوان الوجهة",
      couldNotFindLocation: "تعذر العثور على الموقع. حاول عنوانًا آخر.",
      pleaseSetBothPoints: "يرجى تعيين نقطة البداية والوجهة.",
      failedFetchRoute: "فشل في جلب المسار. حاول لاحقًا.",
      currentLocation: "الموقع الحالي",
      startpoint:"نقطة البداية",
    },
    landmarks: {
      "algergawiShop": "دكان الجرجاوي",
      "electricityPole": "عمود كهرباء",
      "electricCompany": "شركة الكهرباء",
      "azazmaSchool": "مدرسة العزازمة",
      "algergawiMosque": "مسجد الجرجاوي",
      "abuSwilimMaterials": "مواد بناء أبو سُويلم",
      "abuSwilimMosque": "مسجد أبو سُويلم",
      "abuMuharibButcher": "ملحمة أبو محارب",
      "mauhidetClinic": "عيادة موحدة",
      "dentalClinic": "عيادة أسنان عامة",
      "electricCompanyEntry": "مدخل شركة الكهرباء",
      "greenContainer": "الحاوية الخضراء"
    },
      contactUs: {
        title: 'تواصل معنا',
        subtitle: 'نحن هنا لمساعدتك في أي استفسار لديك',
        whatsapp: 'تواصل عبر واتساب',
        socialMedia: 'وسائل التواصل الاجتماعي',
        asraa: {
          name: 'أسراء الجرجاوي',
          email: 'asraaalgergawi@gmail.com',
          phone: '+972523694162',
          role: 'مديرة التطوير'
        },
        tasneem: {
          name: 'تسنيم شنيور',
          email: 'tasadel2002@gmail.com',
          phone: '+972545993204',
          role: 'مديرة التطوير'
        },
        somaya: {
          name: 'سمية ابو سمور',
          email: 'ssomaya252@gmail.com',
          phone: '+972544822959',
          role: 'مديرة التطوير'
        }
      },
      userStatus: {
        superLocal: "مقيم مميز",
        superLocalDesc: "لديك صلاحيات مقيم مميز!",
        activeResident: "مقيم نشط",
        activeResidentDesc: "أنت مساهم نشط لديك {count} عنصر موثق!",
        regularResident: "مقيم عادي",
        regularResidentDesc: "ابدأ بإضافة وتوثيق المعالم والطرق"
      },

      stats: {
        landmarks: "المعالم",
        routes: "الطرق",
        correctVotes: "الأصوات الصحيحة"
      },

      progress: {
        title: "التقدم نحو المستوى التالي",
        verificationsNeeded: "تحتاج إلى {count} توثيقات إضافية لتصبح مقيم نشط",
        votesNeeded: "تحتاج إلى {count} أصوات صحيحة إضافية لتصبح مقيم مميز"
      },

      buttons: {
        applySuperLocal: "التقدم لتصبح مقيم مميز",
        addLandmark: "إضافة معلم",
        addRoute: "إضافة طريق"
      },

      status: {
        requestPending: "طلب المقيم المميز قيد انتظار موافقة المسؤول"
      },

      alerts: {
        error: "خطأ",
        success: "نجاح",
        notAuthenticated: "غير مصرح به",
        requestFailed: "فشل إرسال الطلب. يرجى المحاولة مرة أخرى.",
        loadUserData: "فشل تحميل بيانات المستخدم. يرجى التحقق من اتصالك."
      },
      home: {
      startPoint: "نقطة البداية",
      destination: "الوجهة",
      setStart: "تحديد البداية",
      setDestination: "تحديد الوجهة",
      showRoutes: "عرض الطرق",
      showRoute: "عرض الطريق",
      startNavigation: "بدء الملاحة",
      distance: "المسافة",
      duration: "المدة",
      navigationSteps: "خطوات الملاحة",
      previous: "السابق",
      next: "التالي",
      currentLocation: "الموقع الحالي",
      stopNavigation: "إيقاف الملاحة",
      searchLandmark: "البحث عن معلم...",
      routeInfo: "معلومات الطريق",
      routeActions: "إجراءات الطريق",
      eta: "الوقت المتوقع للوصول",
      startPlaceholder: "الموقع الحالي أو عنوان محدد",
      destinationPlaceholder: "عنوان الوجهة"
    },
    addLandmark: {
      searchPlaceholder: "ابحث عن معالم...",
      filterAll: "الكل",
      filterVerified: "موثق",
      filterPending: "قيد الانتظار",
      pendingLandmarksTitle: "المعالم قيد المراجعة",
      noPendingLandmarks: "لا توجد معالم قيد المراجعة في هذه المنطقة",
      yourLocation: "موقعك الحالي",
      verified: "موثق",
      pendingVerification: "قيد المراجعة",
      showForm: "عرض النموذج",
      minimizeForm: "تصغير النموذج",
      addLandmarkTitle: "إضافة معلم جديد",
      landmarkTitlePlaceholder: "اسم المعلم",
      descriptionPlaceholder: "الوصف (اختياري)",
      changeImage: "تغيير الصورة",
      selectImage: "اختيار صورة (اختياري)",
      addLandmarkButton: "إضافة المعلم",
      cancelButton: "إلغاء",
      tapToAdd: "اضغط على الخريطة لإضافة معلم",
      helpVerify: "مساعدة في التحقق",
      isAccurate: "هل هذا المعلم دقيق؟",
      confirm: "تأكيد",
      reject: "رفض",
      validation: {
      nameRequired: "اسم المعلم مطلوب",
      locationRequired: "الموقع مطلوب"
      },
      success: "تمت إضافة المعلم بنجاح!",
      error: "حدث خطأ أثناء إضافة المعلم"
    }, 
  addRoute: {
    route: "مسار",
    searchPlaceholder: "ابحث عن أماكن...",
    filterAll: "الكل",
    filterVerified: "موثق",
    filterPending: "قيد الانتظار",
    pendingRoutesTitle: "المسارات قيد المراجعة",
    noPendingRoutes: "لا توجد مسارات قيد المراجعة",
    yourLocation: "موقعك الحالي",
    verified: "موثق",
    pendingVerification: "قيد المراجعة",
    showForm: "عرض النموذج",
    minimizeForm: "تصغير النموذج",
    addRouteTitle: "إضافة مسار جديد",
    routeTitlePlaceholder: "عنوان المسار",
    descriptionPlaceholder: "الوصف (اختياري)",
    saveButton: "حفظ",
    drawRoute: "رسم مسار",
    cancelDrawing: "إلغاء الرسم",
    pointsCount: "عدد النقاط",
    drawingRouteWithPoints: "رسم مسار مع {count} نقاط",
    distance: "المسافة",
    helpVerify: "مساعدة في التحقق",
    isAccurate: "هل هذا المسار دقيق؟",
    confirm: "تأكيد",
    reject: "رفض",
    validation: {
      titleRequired: "عنوان المسار مطلوب",
      minPoints: "يجب أن يحتوي المسار على نقطتين على الأقل"
    },
    votedYes: "صوت بنعم",
    votedNo: "صوت بلا",
    voteNo: "صوت بلا",
    voteYes: "صوت بنعم",
    success: "تم حفظ المسار بنجاح!",
    error: "حدث خطأ أثناء حفظ المسار",
    tapToAdd: "اضغط على الخريطة لإضافة نقطة",
    km: "كم",
    m: "م",
    deleteRoute: "حذف المسار",
    close: "إغلاق",
    routeInformation: "معلومات المسار",
    needsTribalReview: "يحتاج إلى مراجعة قبلية",
    verificationStatus: "حالة التحقق"
    },
  admin: {
    title: 'لوحة تحكم الأدمن',
    logout: 'تسجيل خروج',
    totalUsers: 'إجمالي المستخدمين',
    systemHealth: 'حالة النظام',
    verificationSettings: 'إعدادات التحقق',
    verificationRadius: 'نطاق التحقق',
    updateRadius: 'تحديث النطاق',
    userManagement: 'إدارة المستخدمين',
    viewUsers: 'عرض المستخدمين',
    hideUsers: 'إخفاء المستخدمين',
    createUser: 'إنشاء مستخدم',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    superLocal: 'سوبر محلي',
    noUsers: 'لا يوجد مستخدمين',
    refresh: 'تحديث',
    tryAgain: 'حاول مرة أخرى',
    error: 'خطأ',
    adminRole: 'أدمن',
    emergencyRole: 'طوارئ',
    localRole: 'محلي',
    success: 'نجاح',
    failed: 'فشل',
    meters: 'متر',
    percent: '٪',
    yes: 'نعم',
    no: 'لا'
  }
      
    
  
  };