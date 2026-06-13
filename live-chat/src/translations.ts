export interface TranslationDict {
  appTitle: string;
  loginSub: string;
  nameLabel: string;
  namePlaceholder: string;
  passLabelAdmin: string;
  passLabelUser: string;
  passPlaceholderAdmin: string;
  passPlaceholderUser: string;
  pinWarning: string;
  verifying: string;
  btnAdminLogin: string;
  btnGetStarted: string;
  adminPanel: string;
  liveChat: string;
  connectedUsers: string;
  connecting: string;
  chat: string;
  feed: string;
  liveChatroom: string;
  communityFeed: string;
  digitalClock: string;
  soundOn: string;
  soundOff: string;
  logout: string;
  playstoreAds: string;
  searchQueryPlaceholder: string;
  usersListLabel: string;
  noUserFound: string;
  noUserFoundSub: string;
  adminBadge: string;
  onlineBadge: string;
  offlineBadge: string;
  youLabel: string;
  typingLabel: string;
  messagePlaceholder: string;
  selectPartnerTitle: string;
  selectPartnerSub: string;
  realtimeSyncBadge: string;
  communityGuidelinesTitle: string;
  communityGuidelinesSub: string;
  createPostPlaceholder: string;
  postButtonText: string;
  characterCountText: string;
  firstPostPlaceholder: string;
  firstPostPlaceholderSub: string;
  editedBadge: string;
  reactionsCountText: string;
  noReactionsText: string;
  commentsCountText: string;
  commentsMinLabel: string;
  writeCommentPlaceholder: string;
  commentButtonText: string;
  deleteButtonText: string;
  editButtonText: string;
  saveButtonText: string;
  cancelButtonText: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDeleteButton: string;
  confirmCancelButton: string;
  adTitle: string;
  adSubtitle: string;
  adClickEarn: string;
  adClose: string;
  totalUsersStats: string;
  onlineUsersStats: string;
  messagesCountStats: string;
  loginErrorPrefix: string;
  loginPinError: string;
  loginWrongPass: string;
  serverErrorMsg: string;
  configModalTitle: string;
  configModalSub: string;
}

export const translations: Record<'bn' | 'en', TranslationDict> = {
  bn: {
    appTitle: 'লাইভ চ্যাটরুম',
    loginSub: 'সরাসরি অন্য ব্যবহারকারীদের সাথে যুক্ত হতে আপনার নাম দিয়ে শুরু করুন। কোনো অতিরিক্ত পাসওয়ার্ড বা ফি লাগবে না।',
    nameLabel: 'আপনার নাম বা ইমেইল দিন',
    namePlaceholder: 'যেমন: সাকিব আল হাসান',
    passLabelAdmin: 'এডমিন পাসওয়ার্ড দিন',
    passLabelUser: 'সিক্রেট পিন বা পাসওয়ার্ড দিন',
    passPlaceholderAdmin: 'পাসওয়ার্ড লিখুন...',
    passPlaceholderUser: 'যেমন: ১২৩৪ বা আপনার পাসওয়ার্ড',
    pinWarning: '🔒 নতুন নাম হলে এটি আপনার পাসওয়ার্ড হবে। পরবর্তীতে একই অ্যাকাউন্টে চ্যাট করতে এই পিন/পাসওয়ার্ডটি অবশ্যই প্রয়োজন পড়বে।',
    verifying: 'যাচাই করা হচ্ছে...',
    btnAdminLogin: 'এডমিন লগইন করুন',
    btnGetStarted: 'আজই শুরু করুন',
    adminPanel: 'এডমিন কন্ট্রোল প্যানেল',
    liveChat: 'লাইভ চ্যাট',
    connectedUsers: 'কানেক্টেড',
    connecting: 'কানেক্টিং...',
    chat: 'চ্যাট',
    feed: 'ফিড',
    liveChatroom: 'লাইভ চ্যাটরুম',
    communityFeed: 'কমিউনিটি ফিড ও পোস্ট',
    digitalClock: 'ডিজিটাল ঘড়ি',
    soundOn: 'সাউন্ড বন্ধ করুন',
    soundOff: 'সাউন্ড চালু করুন',
    logout: 'লগআউট',
    playstoreAds: 'প্লে-স্টোর ও বিজ্ঞাপন',
    searchQueryPlaceholder: 'নাম দিয়ে খুঁজুন...',
    usersListLabel: 'ব্যবহারকারী তালিকা',
    noUserFound: 'কোনো ব্যবহারকারী পাওয়া যায়নি',
    noUserFoundSub: 'অন্য কোনো ডিভাইস থেকে কাউকে জয়েন করতে বলুন!',
    adminBadge: 'এডমিন',
    onlineBadge: 'অনলাইন',
    offlineBadge: 'অফলাইন',
    youLabel: 'আপনি',
    typingLabel: 'টাইপ করছেন...',
    messagePlaceholder: 'মেসেজ খসড়া করুন...',
    selectPartnerTitle: 'চ্যাটিং পার্টনার সিলেক্ট করুন',
    selectPartnerSub: 'বামদিকের তালিকা থেকে যেকোনো ব্যবহারকারী নির্বাচন করে তার সাথে ১-টু-১ সিঙ্গেল চ্যাটিং শুরু করুন। লাইভ মেসেজিঙে যেকোনো সময় আপনি একে অপরের টাইপিং অবস্থা এবং মেসেজ পড়া হয়েছে কিনা তা দেখতে পাবেন।',
    realtimeSyncBadge: '● Realtime Synchronization Enabled',
    communityGuidelinesTitle: 'কমিউনিটি নির্দেশিকা',
    communityGuidelinesSub: 'আপনার মনের কথা লিখে পোস্ট করুন! এটি একটি ওপেন পাবলিক প্ল্যাটফর্ম যেখানে সকল ব্যবহারকারী আপনার পোস্ট দেখতে, লাইক/লাভ রিয়্যাক্ট এবং মতামত (কমেন্ট) প্রকাশ করতে পারবেন।',
    createPostPlaceholder: 'আজকে আপনার মনে কী চলছে? লিখে ফেলুন...',
    postButtonText: 'পোস্ট করুন',
    characterCountText: 'লেখা পোস্ট করুন',
    firstPostPlaceholder: 'এখনো কোনো পোস্ট নেই!',
    firstPostPlaceholderSub: 'প্রথম ব্যক্তি হিসেবে আপনার মনের কোনো চিন্তা বা সুন্দর স্ট্যাটাস লিখে উপরে পোস্ট করে দিন!',
    editedBadge: '(সম্পাদিত)',
    reactionsCountText: 'টি রিয়্যাকশন',
    noReactionsText: 'কোনো রিয়্যাকশন নেই',
    commentsCountText: 'টি মন্তব্য',
    commentsMinLabel: 'কমেন্ট',
    writeCommentPlaceholder: 'মতামত বা কমেন্ট লিখুন...',
    commentButtonText: 'কমেন্ট করুন',
    deleteButtonText: 'মুছুন',
    editButtonText: 'ইডিট',
    saveButtonText: 'সংরক্ষণ করুন',
    cancelButtonText: 'বাতিল',
    confirmDeleteTitle: 'ডিলিট করতে চান?',
    confirmDeleteMessage: 'আপনি কি নিশ্চিত যে এই পোস্টটি চিরতরে মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব হবে না।',
    confirmDeleteButton: 'হ্যাঁ, ডিলিট করুন',
    confirmCancelButton: 'না, বাতিল করুন',
    adTitle: 'বিজ্ঞাপন ও ডেভেলপমেন্ট',
    adSubtitle: 'প্রজেক্টটি সচল রাখতে নিচে বিজ্ঞাপন যুক্ত করা হয়েছে।',
    adClickEarn: 'বিজ্ঞাপনে ক্লিক করে আমাদের সাপোর্ট করুন!',
    adClose: 'বন্ধ করুন',
    totalUsersStats: 'মোট ইউজার',
    onlineUsersStats: 'অনলাইন',
    messagesCountStats: 'মোট বার্তা',
    loginErrorPrefix: 'অনলাইনে চ্যাট শুরু করতে আপনার নাম বাংলায় বা ইংরেজিতে লিখুন।',
    loginPinError: 'অ্যাকাউন্ট সুরক্ষিত রাখতে অবশ্যই কমপক্ষে ৪ সংখ্যার সিক্রেট পিন বা পাসওয়ার্ড দিতে হবে।',
    loginWrongPass: 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।',
    serverErrorMsg: 'সার্ভারের সাথে যোগাযোগ করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।',
    configModalTitle: 'প্লে-স্টোর অ্যাপ ও বিজ্ঞাপন',
    configModalSub: 'অ্যাপ্লিকেশন ইন্টিগ্রেশন এবং গুগল প্লে সার্ভিস সমূহ',
  },
  en: {
    appTitle: 'Live Chatroom',
    loginSub: 'Start with your name or email to connect directly with other users. No extra password or subscription fee is required.',
    nameLabel: 'Your Name or Email',
    namePlaceholder: 'e.g. Shakib Al Hasan',
    passLabelAdmin: 'Enter Admin Password',
    passLabelUser: 'Secret PIN or Password',
    passPlaceholderAdmin: 'Type your password...',
    passPlaceholderUser: 'e.g. 1234 or your own password',
    pinWarning: '🔒 If it\'s a new name, this will be your password. You will need this PIN/password to chat with the same account in the future.',
    verifying: 'Verifying...',
    btnAdminLogin: 'Admin Login',
    btnGetStarted: 'Get Started',
    adminPanel: 'Admin Control Panel',
    liveChat: 'Live Chat',
    connectedUsers: 'Connected',
    connecting: 'Connecting...',
    chat: 'Chat',
    feed: 'Feed',
    liveChatroom: 'Live Chatroom',
    communityFeed: 'Community Feed & Posts',
    digitalClock: 'Digital Clock',
    soundOn: 'Mute Sound',
    soundOff: 'Unmute Sound',
    logout: 'Logout',
    playstoreAds: 'App & Ads',
    searchQueryPlaceholder: 'Search name...',
    usersListLabel: 'Users List',
    noUserFound: 'No users found',
    noUserFoundSub: 'Ask someone to join from another device!',
    adminBadge: 'Admin',
    onlineBadge: 'Online',
    offlineBadge: 'Offline',
    youLabel: 'You',
    typingLabel: 'typing...',
    messagePlaceholder: 'Draft a message...',
    selectPartnerTitle: 'Select a Chat Partner',
    selectPartnerSub: 'Select any user from the left panel to start a secure 1-to-1 live chat. You can see real-time message read states and active typing status.',
    realtimeSyncBadge: '● Realtime Synchronization Enabled',
    communityGuidelinesTitle: 'Community Guidelines',
    communityGuidelinesSub: 'Write down what\'s on your mind! This is an open public community platform where all users can see your posts, react with like/love emojis, and share comments.',
    createPostPlaceholder: 'What\'s on your mind today? Write here...',
    postButtonText: 'Post Now',
    characterCountText: 'Create a post',
    firstPostPlaceholder: 'No posts yet!',
    firstPostPlaceholderSub: 'Be the first to share your thoughts or status updates with the community!',
    editedBadge: '(edited)',
    reactionsCountText: ' Reactions',
    noReactionsText: 'No reactions yet',
    commentsCountText: ' Comments',
    commentsMinLabel: 'Comments',
    writeCommentPlaceholder: 'Write a comment...',
    commentButtonText: 'Comment',
    deleteButtonText: 'Delete',
    editButtonText: 'Edit',
    saveButtonText: 'Save Changes',
    cancelButtonText: 'Cancel',
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteMessage: 'Are you sure you want to permanently delete this post? This action cannot be undone.',
    confirmDeleteButton: 'Yes, Delete',
    confirmCancelButton: 'No, Cancel',
    adTitle: 'Sponsored Support',
    adSubtitle: 'Help us maintain server resources and operations.',
    adClickEarn: 'Click on the ad banner to support our project!',
    adClose: 'Close',
    totalUsersStats: 'Total Users',
    onlineUsersStats: 'Online',
    messagesCountStats: 'Total Texts',
    loginErrorPrefix: 'Please enter your name in Bangla or English to start chatting.',
    loginPinError: 'To keep your account secure, you must provide a secret PIN/password with at least 4 characters.',
    loginWrongPass: 'Incorrect password! Please enter the correct password.',
    serverErrorMsg: 'Server connection failed. Please try again.',
    configModalTitle: 'Play Store App & Sponsored Ads',
    configModalSub: 'Application integration and Google Play services management',
  }
};
