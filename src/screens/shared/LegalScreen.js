import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import ContentReportModal from '../../components/ContentReportModal';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const POLICY_TYPES = [
  { id: 'terms', icon: '📜', titleEn: 'Terms & Conditions', titleTa: 'விதிமுறைகள்', titleMl: 'ഉപാധികൾ' },
  { id: 'privacy', icon: '🛡️', titleEn: 'Privacy Policy', titleTa: 'தனியுரிமைக் கொள்கை', titleMl: 'സ്വകാര്യതാ നയം' },
  { id: 'community', icon: '🔰', titleEn: 'Community Guidelines', titleTa: 'சமூக வழிகாட்டுதல்கள்', titleMl: 'കമ്മ്യൂണിറ്റി മാർഗ്ഗനിർദ്ദേശങ്ങൾ' },
  { id: 'about', icon: 'ℹ️', titleEn: 'About Us', titleTa: 'எங்களைப் பற்றி', titleMl: 'ഞങ്ങളെക്കുറിച്ച്' },
  { id: 'refund', icon: '🪙', titleEn: 'Refund Policy', titleTa: 'பணம் திரும்பப்பெறும் கொள்கை', titleMl: 'റീഫണ്ട് നയം' },
  { id: 'delivery', icon: '🚚', titleEn: 'Delivery Policy', titleTa: 'டெலிவரி கொள்கை', titleMl: 'ഡെലിവറി നയം' },
  { id: 'agreement', icon: '🤝', titleEn: 'Seller Agreement', titleTa: 'விவசாயி ஒப்பந்தம்', titleMl: 'കർഷക കരാർ' },
  { id: 'licenses', icon: '📦', titleEn: 'Open Source Licenses', titleTa: 'திறந்த மூல உரிமங்கள்', titleMl: 'ഓപ്പൺ സോഴ്സ് ലൈസൻസുകൾ' },
];

const OPEN_SOURCE_PACKAGES = [
  { name: 'React Native', license: 'MIT License', url: 'https://github.com/facebook/react-native', desc: 'Cross-platform mobile application framework by Meta/Facebook.' },
  { name: 'React Navigation', license: 'MIT License', url: 'https://github.com/react-navigation/react-navigation', desc: 'Routing and navigation for React Native apps.' },
  { name: 'Firebase SDK (Android/iOS)', license: 'Apache License 2.0', url: 'https://github.com/firebase/firebase-js-sdk', desc: 'Backend authentication, Firestore, and FCM notifications SDK by Google.' },
  { name: 'Cloudinary React Native SDK', license: 'MIT License', url: 'https://github.com/cloudinary/cloudinary_react_native', desc: 'Cloud media storage and image/video transformation SDK.' },
  { name: 'React Native Vector Icons', license: 'MIT License', url: 'https://github.com/oblador/react-native-vector-icons', desc: 'Customizable icons for React Native.' },
  { name: 'Axios HTTP Client', license: 'MIT License', url: 'https://github.com/axios/axios', desc: 'Promise-based HTTP client for browser and node.js.' },
  { name: 'react-native-maps', license: 'MIT License', url: 'https://github.com/react-native-maps/react-native-maps', desc: 'Mapview component for React Native (Google Maps API).' },
  { name: 'i18next & react-i18next', license: 'MIT License', url: 'https://github.com/i18next/react-i18next', desc: 'Internationalization framework for React and React Native.' },
  { name: 'React Native Linear Gradient', license: 'MIT License', url: 'https://github.com/react-native-linear-gradient/react-native-linear-gradient', desc: 'Gradient color display component.' },
  { name: 'Async Storage', license: 'MIT License', url: 'https://github.com/react-native-async-storage/async-storage', desc: 'Unencrypted, asynchronous, persistent, key-value storage.' },
];

const LegalScreen = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const initialType = route.params?.type || 'terms';

  const [activeType, setActiveType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const currentLang = i18n.language || 'ta';

  const toggleSection = index => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getPolicyContent = () => {
    switch (activeType) {
      case 'privacy':
        return {
          title: currentLang === 'ta' ? 'Zunkako தனியுரிமைக் கொள்கை (Privacy Policy)' : currentLang === 'ml' ? 'Zunkako സ്വകാര്യതാ നയം' : 'Zunkako Privacy Policy',
          lastUpdated: 'Effective Date: September 2026',
          intro: currentLang === 'ta'
            ? 'Zunkako உங்கள் தனியுரிமையை 100% பாதுகாப்பதில் உறுதியாக உள்ளது. இந்த தனியுரிமைக் கொள்கை நாங்கள் எந்தெந்தத் தகவல்களைச் சேகரிக்கிறோம், அவற்றை எவ்வாறு பாதுகாப்பாகப் பயன்படுத்துகிறோம் என்பதை விரிவாக விளக்குகிறது.'
            : currentLang === 'ml'
            ? 'Zunkako നിങ്ങളുടെ സ്വകാര്യത 100% സംരക്ഷിക്കാൻ പ്രതിജ്ഞാബദ്ധമാണ്. ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങളും അവയുടെ ഉപയോഗവും ഇവിടെ വിശദീകരിക്കുന്നു.'
            : 'Zunkako is committed to protecting your privacy. This policy details how we collect, use, and protect your personal information.',
          sections: [
            {
              title: currentLang === 'ta' ? '1. நாங்கள் சேகரிக்கும் தகவல்கள் (Data We Collect)' : currentLang === 'ml' ? '1. ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങൾ' : '1. Information We Collect',
              body: currentLang === 'ta'
                ? 'நாங்கள் பின்வரும் தகவல்களை சேகரிக்கிறோம்:\n• தனிப்பயன் விவரங்கள்: பெயர், மின்னஞ்சல் முகவரி, மொபைல் எண்.\n• இருப்பிடத் தரவு (GPS Location): பொருட்கள் டெலிவரி செய்யவும் பண்ணை தூரத்தை கணக்கிடவும் பயன்படுகிறது.\n• ஆர்டர் வரலாறு: நீங்கள் வாங்கிய காய்கறிகள் மற்றும் பணம் செலுத்திய ரசீதுகள்.\n• பதிவேற்றிய புகைப்படங்கள் மற்றும் வீடியோக்கள்: விவசாயிகள் பதிவேற்றும் அறுவடை படங்கள் மற்றும் Reels வீடியோக்கள்.\n• சாதன விவரங்கள் மற்றும் FCM Tokens: உங்களது மொபைல் போன் மாடல் மற்றும் Push Notification அனுப்புவதற்கான Tokens.'
                : currentLang === 'ml'
                ? 'ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങൾ:\n• പേര്, ഇമെയിൽ, ഫോൺ നമ്പർ.\n• ലൊക്കേഷൻ വിവരങ്ങൾ (GPS).\n• ഓർഡർ ഹിസ്റ്ററിയും പേയ്‌മെന്റ് വിവരങ്ങളും.\n• അപ്‌ലോഡ് ചെയ്ത ചിത്രങ്ങളും വീഡിയോകളും.\n• ഉപകരണ വിവരങ്ങളും നോട്ടിഫിക്കേഷൻ ടോക്കണുകളും.'
                : 'We collect:\n• Personal Information: Name, email address, phone number.\n• Location Data (GPS): Used strictly for order delivery and farm distance calculations.\n• Transaction History: Products purchased and payment receipts.\n• Uploaded Content: Farm story reels and product images uploaded by users.\n• Device Identifiers: Device model and FCM push notification tokens.',
            },
            {
              title: currentLang === 'ta' ? '2. தகவல்களைப் பயன்படுத்தும் நோக்கம் (How We Use Data)' : currentLang === 'ml' ? '2. വിവരങ്ങളുടെ ഉപയോഗം' : '2. How We Use Your Data',
              body: currentLang === 'ta'
                ? 'உங்கள் தகவல்கள் பின்வரும் நன்மைகளுக்காக மட்டுமே பயன்படுத்தப்படுகின்றன:\n• உங்களுடைய ஆர்டர்களைச் சரியாகச் செயல்படுத்தி டெலிவரி செய்ய.\n• விவசாயிகள் மற்றும் நுகர்வோர் இடையே தொடர்பை ஏற்படுத்த.\n• ஆர்டர் நிலை குறித்த நேரலை Push Notification தகவல்களை அனுப்ப.\n• போலி கணக்குகள் மற்றும் நிதி மோசடிகளைத் தடுக்க.'
                : currentLang === 'ml'
                ? 'വിവരങ്ങൾ ഉപയോഗിക്കുന്നത്:\n• ഓർഡർ പ്രോസസ്സിംഗിനും ഡെലിവറിക്കും.\n• കർഷകരും ഉപഭോക്താക്കളും തമ്മിലുള്ള ആശയവിനിമയത്തിന്.\n• തത്സമയ നോട്ടിഫിക്കേഷനുകൾ അയക്കാൻ.\n• തട്ടിപ്പുകൾ തടയാൻ.'
                : 'Your data is used strictly for:\n• Processing and delivering your agricultural orders.\n• Facilitating direct farmer-consumer communication.\n• Sending real-time push notifications regarding order status.\n• Preventing fraud, fake profiles, and unauthorized platform access.',
            },
            {
              title: currentLang === 'ta' ? '3. தரவு பகிர்வு & பாதுகாப்பு (Data Sharing & Zero Third-Party Sale)' : currentLang === 'ml' ? '3. വിവരങ്ങൾ പങ്കിടൽ' : '3. Data Sharing & Security',
              body: currentLang === 'ta'
                ? '🔒 பாதுகாப்பு உத்தரவாதம்:\n• உங்கள் போன் எண் அல்லது தனிப்பட்ட விவரங்கள் எந்தவொரு விளம்பர நிறுவனங்களுக்கும் விற்கப்படாது (NOT sold to third parties).\n• டெலிவரி செய்ய ஒதுக்கப்பட்ட Delivery Partner மற்றும் ஆன்லைன் கட்டணச் செயலிக்கு (Payment Gateway) மட்டுமே தேவையான தகவல்கள் பகிரப்படும்.\n• அனைத்துத் தரவுகளும் Google Firebase-ன் SSL/TLS 256-bit குறியாக்கம் (Encryption) மூலம் பாதுகாப்பாக சேமிக்கப்படுகின்றன.'
                : currentLang === 'ml'
                ? '🔒 സുരക്ഷാ ഗ്യാരണ്ടി:\n• നിങ്ങളുടെ വിവരങ്ങൾ മൂന്നാം കക്ഷികൾക്ക് വിൽക്കില്ല.\n• ഡെലിവറി പാർട്ണർമാർക്കും പേയ്‌മെന്റ് പ്രോസസ്സറുകൾക്കും മാത്രം ആവശ്യമായ വിവരങ്ങൾ നൽകുന്നു.\n• വിവരങ്ങൾ ഫയർബേസ് എൻക്രിപ്ഷൻ വഴി സുരക്ഷിതമാണ്.'
                : '🔒 Data Security Guarantee:\n• Your data is NEVER sold to third-party advertisers or data brokers.\n• Information is shared ONLY with assigned delivery partners and payment processors to complete transactions.\n• All data is encrypted using Google Firebase SSL/TLS 256-bit security standards.',
            },
            {
              title: currentLang === 'ta' ? '4. பயனர் உரிமைகள் (User Data Rights & Account Deletion)' : currentLang === 'ml' ? '4. ഉപയോക്തൃ അവകാശങ്ങൾ' : '4. User Data Rights',
              body: currentLang === 'ta'
                ? 'உங்களுக்கு உங்கள் தரவு மீது முழு உரிமை உண்டு:\n• உங்கள் கணக்கை எப்போது வேண்டுமானாலும் நீக்கலாம் (Account Deletion).\n• உங்கள் தகவல்களின் நகலை எங்களிடம் கோரலாம்.\n• விளம்பர அறிவிப்புகளைத் தவிர்க்கலாம் (Opt-out).'
                : currentLang === 'ml'
                ? '• നിങ്ങളുടെ അക്കൗണ്ട് എപ്പോൾ വേണമെങ്കിലും നീക്കം ചെയ്യാം.\n• വിവരങ്ങളുടെ പകർപ്പ് ആവശ്യപ്പെടാം.'
                : 'You have full rights over your data:\n• Request complete account deletion at any time.\n• Request a copy of all stored personal information.\n• Opt-out of non-essential push notifications.',
            },
          ],
        };

      case 'community':
        return {
          title: currentLang === 'ta' ? 'Zunkako சமூக வழிகாட்டுதல்கள் (Community Guidelines)' : currentLang === 'ml' ? 'Zunkako കമ്മ്യൂണിറ്റി മാർഗ്ഗനിർദ്ദേശങ്ങൾ' : 'Community Guidelines',
          lastUpdated: 'Updated: September 2026',
          intro: currentLang === 'ta'
            ? 'Zunkako ஒரு நேர்மையான விவசாய சந்தை தளமாகும். இதில் விவசாயிகள் மற்றும் நுகர்வோர் அனைவரும் பாதுகாப்பாக செயல்பட கீழ்க்கண்ட சமூக விதிகளை கண்டிப்பாக பின்பற்ற வேண்டும்.'
            : currentLang === 'ml'
            ? 'കർഷകർക്കും ഉപഭോക്താക്കൾക്കും സുരക്ഷിതമായ അന്തരീക്ഷം ഉറപ്പാക്കാൻ ഈ മാർഗ്ഗനിർദ്ദേശങ്ങൾ പാലിക്കുക.'
            : 'To maintain a safe agricultural community, all users must follow these rules when uploading content or using Zunkako.',
          sections: [
            {
              title: currentLang === 'ta' ? '✅ அனுமதிக்கப்பட்ட உள்ளடக்கங்கள் (Allowed Content)' : currentLang === 'ml' ? '✅ അനുവദനീയമായവ' : '✅ Allowed Content',
              body: currentLang === 'ta'
                ? '• புதிய காய்கறிகள், பழங்கள் மற்றும் இயற்கை விவசாய பொருட்களின் படங்கள்.\n• விவசாய நிலங்கள், அறுவடை நேரலை வீடியோக்கள் மற்றும் இயற்கை விவசாய குறிப்புகள்.\n• நுகர்வோருக்கான உண்மையான மதிப்பீடுகள் மற்றும் கருத்துக்கள்.'
                : currentLang === 'ml'
                ? '• പുതിയ കാർഷിക ഉൽപ്പന്നങ്ങളുടെ ചിത്രങ്ങൾ.\n• കൃഷിസ്ഥലങ്ങളുടെയും വിളവെടുപ്പിന്റെയും വീഡിയോകൾ.\n• യഥാർത്ഥ ഉപഭോക്തൃ റിവ്യൂകൾ.'
                : '• Genuine photographs of fresh vegetables, fruits, and farm produce.\n• Authentic videos of farming fields, crop harvests, and organic practices.\n• Honest product reviews and constructive feedback.',
            },
            {
              title: currentLang === 'ta' ? '🚫 தடைசெய்யப்பட்ட உள்ளடக்கங்கள் (Strictly Prohibited)' : currentLang === 'ml' ? '🚫 കർശനമായി നിരോധിച്ചവ' : '🚫 Strictly Prohibited Content',
              body: currentLang === 'ta'
                ? '❌ ஆபாசம் அல்லது தவறான படங்கள் (Adult / Explicit Content).\n❌ அரசியல் விவாதங்கள், சினிமா கிளிப்புகள் மற்றும் மீம்ஸ்கள்.\n❌ வன்முறை அல்லது வெறுப்பைத் தூண்டும் கருத்துக்கள்.\n❌ போலி காய்கறி படங்கள் அல்லது பிற தளங்களில் இருந்து திருடப்பட்ட படங்கள்.\n❌ தேவையில்லாத ஸ்பேம் விளம்பரங்கள் மற்றும் போலியான தொலைபேசி எண்கள்.'
                : currentLang === 'ml'
                ? '❌ അശ്ലീല ഉള്ളടക്കം.\n❌ രാഷ്ട്രീയം, സിനിമ, മീമുകൾ.\n❌ അക്രമകരമായ ദൃശ്യങ്ങൾ.\n❌ വ്യാജ ഉൽപ്പന്ന ചിത്രങ്ങൾ.'
                : '❌ Adult, explicit, or sexually suggestive material.\n❌ Political propaganda, movie clips, and unrelated meme videos.\n❌ Hate speech, harassment, or violent content.\n❌ Fake product photos downloaded from third-party internet sites.\n❌ Unsolicited spam, commercial advertising, or fraudulent offers.',
            },
            {
              title: currentLang === 'ta' ? '⚖️ கணக்கு இடைநிறுத்தம் & நடவடிக்கை (Account Suspension Policy)' : currentLang === 'ml' ? '⚖️ അക്കൗണ്ട് സസ്‌പെൻഷൻ' : '⚖️ Moderation & Account Suspension',
              body: currentLang === 'ta'
                ? '• சமூக விதிமுறைகளை மீறும் கணக்குகள் முன்னறிவிப்பின்றி உடனடியாக இடைநிறுத்தம் (Permanent Account Suspension) செய்யப்படும்.\n• போலி பொருட்கள் விற்கும் விவசாயிகள் மீது சட்டப்பூர்வ நடவடிக்கை எடுக்கப்படும்.'
                : currentLang === 'ml'
                ? '• നിയമലംഘനം നടത്തുന്ന അക്കൗണ്ടുകൾ ഉടൻ സസ്‌പെൻഡ് ചെയ്യും.'
                : '• Accounts violating community guidelines will face immediate content removal and permanent account suspension.\n• Fraudulent sellers listing fake organic items will be permanently barred from Zunkako marketplace.',
            },
          ],
        };

      case 'about':
        return {
          title: currentLang === 'ta' ? 'Zunkako பற்றிய விவரங்கள் (About Us)' : currentLang === 'ml' ? 'Zunkako യെക്കുറിച്ച്' : 'About Zunkako App',
          lastUpdated: 'Version 1.0.0 (Production Release)',
          intro: currentLang === 'ta'
            ? 'Zunkako என்பது விவசாயிகளையும் நுகர்வோரையும் நேரடியாக இணைக்கும் ஒரு புரட்சிகர டிஜிட்டல் தளமாகும். இடைத்தரகர்கள் இல்லாமல் நியாயமான விலையில் புதிய காய்கறிகளை உங்கள் வீட்டு வாசலுக்குக் கொண்டு சேர்ப்பதே எங்கள் முதன்மை இலக்காகும்.'
            : currentLang === 'ml'
            ? 'കർഷകരെയും ഉപഭോക്താക്കളെയും നേരിട്ട് ബന്ധിപ്പിക്കുന്ന ഡിജിറ്റൽ പ്ലാറ്റ്‌ഫോമാണ് Zunkako.'
            : 'Zunkako is a revolutionary Farm-to-Consumer platform eliminating agricultural middlemen, empowering rural farmers, and delivering fresh harvest directly to households.',
          sections: [
            {
              title: currentLang === 'ta' ? '🌱 எங்கள் நோக்கம் (Our Mission)' : currentLang === 'ml' ? '🌱 ഞങ്ങളുടെ ലക്ഷ്യം' : '🌱 Our Mission',
              body: currentLang === 'ta'
                ? '• விவசாயிகளுக்கு அவர்களின் உழைப்பிற்கு ஏற்ற நியாயமான லாபம் கிடைக்கச் செய்வது.\n• நுகர்வோருக்கு 100% புதிய மற்றும் தரமான காய்கறிகளை 10-30% குறைந்த விலையில் வழங்குவது.'
                : currentLang === 'ml'
                ? '• കർഷകർക്ക് അർഹമായ വില ഉറപ്പാക്കുക.\n• ഉപഭോക്താക്കൾക്ക് പുതിയ ഉൽപ്പന്നങ്ങൾ കുറഞ്ഞ വിലയിൽ എത്തിക്കുക.'
                : '• Empowering hard-working farmers with direct market access and dignified profits.\n• Providing consumers with fresh farm produce at fair transparent prices without middleman markups.',
            },
            {
              title: currentLang === 'ta' ? '⭐ Zunkako சிறப்பம்சங்கள் (Key Highlights)' : currentLang === 'ml' ? '⭐ പ്രധാന സവിശേഷതകൾ' : '⭐ Platform Highlights',
              body: currentLang === 'ta'
                ? '🌾 Harvest Calendar - வாராந்திர அறுவடை அட்டவணை.\n⏱ Freshness Tracker - அறுவடை செய்யப்பட்ட நேரலை கணக்கீடு.\n👨‍👩‍👧 Group Buy & Pre-Order - குழுவாக வாங்கி கூடுதல் தள்ளுபடி பெறுதல்.\n🗺️ Farm Visit - பண்ணைகளுக்கு நேரில் சென்று பார்வையிடும் வசதி.\n📷 QR Verification - விவசாயியின் நம்பகத்தன்மையை சரிபார்க்கும் வசதி.'
                : currentLang === 'ml'
                ? '🌾 വിളവെടുപ്പ് കലണ്ടർ.\n⏱ ഫ്രഷ്‌നെസ് ട്രാക്കർ.\n👨‍👩‍👧 ഗ്രൂപ്പ് ബൈ സൗകര്യം.\n🗺️ ഫാം വിസിറ്റ്.'
                : '🌾 Harvest Calendar: Weekly crop scheduling.\n⏱ Freshness Tracker: Real-time time elapsed since harvest.\n👨‍👩‍👧 Group Buy & Pre-Order: Direct bulk discounts.\n🗺️ Farm Visit: Booking experiential farm tours.',
            },
          ],
        };

      case 'refund':
        return {
          title: currentLang === 'ta' ? 'பணம் திரும்பப்பெறும் கொள்கை (Refund & Cancellation Policy)' : currentLang === 'ml' ? 'റീഫണ്ട് നയം' : 'Refund & Cancellation Policy',
          lastUpdated: 'Updated: September 2026',
          intro: currentLang === 'ta'
            ? 'Zunkako-வில் நீங்கள் வாங்கும் ஒவ்வொரு பொருட்களுக்கும் முழு திருப்தி உத்தரவாதம் உண்டு. பணம் திரும்பப் பெறுதல் மற்றும் ரத்து செய்வதற்கான விதிகள் கீழே விரிவாக கொடுக்கப்பட்டுள்ளன.'
            : currentLang === 'ml'
            ? 'ഓർഡറുകൾ റദ്ദാക്കുന്നതിനും റീഫണ്ട് ലഭിക്കുന്നതിനുമുള്ള വിവരങ്ങൾ താഴെ നൽകുന്നു.'
            : 'Zunkako guarantees full satisfaction with every order. Read our transparent cancellation and refund rules below.',
          sections: [
            {
              title: currentLang === 'ta' ? '🔄 ஆர்டர் ரத்துக் கொள்கை (Order Cancellation Rules)' : currentLang === 'ml' ? '🔄 ഓർഡർ റദ്ദാക്കൽ' : '🔄 Order Cancellation Rules',
              body: currentLang === 'ta'
                ? '• தயாரிப்புகள் விவசாயியால் அனுப்பப்படுவதற்கு முன் ரத்து செய்தால்: 100% முழுப் பணமும் உடனடியாகத் திருப்பியளிக்கப்படும் (Full Refund).\n• பொருட்கள் வாகனத்தில் அனுப்பப்பட்ட பின் ரத்து செய்தால்: டெலிவரி கட்டணம் மட்டும் கழிக்கப்பட்டு மீதித் தொகை திருப்பியளிக்கப்படும்.'
                : currentLang === 'ml'
                ? '• സാധനങ്ങൾ അയക്കുന്നതിന് മുൻപ് റദ്ദാക്കിയാൽ: മുഴുവൻ തുകയും റീഫണ്ട് ചെയ്യും.\n• അയച്ചതിന് ശേഷം: ഡെലിവറി നിരക്ക് ഒഴികെ റീഫണ്ട് ചെയ്യും.'
                : '• Cancellation before item dispatch: 100% Instant Full Refund.\n• Cancellation after item dispatch: Partial refund (order total minus delivery charges).',
            },
            {
              title: currentLang === 'ta' ? '📦 சேதமடைந்த / தவறான பொருட்கள் (Damaged / Wrong Product Refund)' : currentLang === 'ml' ? '📦 കേടായ ഉൽപ്പന്നങ്ങൾ' : '📦 Damaged or Wrong Product Guarantee',
              body: currentLang === 'ta'
                ? '• சேதமடைந்த அல்லது அழுகிய காய்கறிகள் வழங்கப்பட்டால்: 48 மணி நேரத்திற்குள் ஆப்பில் புகைப்படத்துடன் முறையிட்டால் 100% பணம் திருப்பித் தரப்படும் அல்லது புதிய பொருள் மாற்றப்படும்.\n• தவறான பொருள் டெலிவரி செய்யப்பட்டால்: 48 மணி நேரத்திற்குள் முழு பணம் திருப்பியளிக்கப்படும்.'
                : currentLang === 'ml'
                ? '• കേടുപാടുകൾ സംഭവിച്ച ഉൽപ്പന്നങ്ങൾ: 48 മണിക്കൂറിനുള്ളിൽ പരാതി നൽകിയാൽ മുഴുവൻ തുകയും തിരികെ നൽകും.'
                : '• Damaged or spoiled produce: Report via app with photo within 48 hours for a 100% full refund or immediate replacement.\n• Wrong product delivered: 100% refund processed within 48 hours.',
            },
            {
              title: currentLang === 'ta' ? '⏱️ பணம் வரவாகும் காலம் (Refund Processing Timeline)' : currentLang === 'ml' ? '⏱️ റീഫണ്ട് സമയം' : '⏱️ Refund Processing Timeline',
              body: currentLang === 'ta'
                ? '• UPI / GPay / PhonePe மூலம் செலுத்திய பணம்: 24 முதல் 48 மணி நேரத்திற்குள் வங்கிக் கணக்கில் வரவாகும்.\n• வங்கி கார்டுகள் (Debit/Credit Card): 3 முதல் 5 வேலை நாட்களுக்குள் வரவாகும்.'
                : currentLang === 'ml'
                ? '• UPI / GPay വഴി ചെയ്ത പേയ്‌മെന്റുകൾ 24-48 മണിക്കൂറിനുള്ളിൽ തിരികെ ലഭിക്കും.'
                : '• UPI / GPay / PhonePe: Processed within 24 to 48 hours.\n• Credit / Debit Cards: Reflected in bank account within 3 to 5 business days.',
            },
          ],
        };

      case 'delivery':
        return {
          title: currentLang === 'ta' ? 'டெலிவரி கொள்கை (Delivery Policy)' : currentLang === 'ml' ? 'ഡെലിവറി നയം' : 'Delivery Policy',
          lastUpdated: 'Updated: September 2026',
          intro: currentLang === 'ta'
            ? 'புதிய காய்கறிகளை விரைவாகவும் பாதுகாப்பாகவும் நுகர்வோருக்கு கொண்டு சேர்ப்பதற்கான Zunkako டெலிவரி விதிகளின் தொகுப்பு.'
            : currentLang === 'ml'
            ? 'വേഗത്തിലുള്ള ഡെലിവറി ഉറപ്പാക്കുന്നതിനുള്ള മാർഗ്ഗനിർദ്ദേശങ്ങൾ.'
            : 'Zunkako delivery policy ensuring fresh produce reaches households within hours of harvest.',
          sections: [
            {
              title: currentLang === 'ta' ? '📍 டெலிவரி மண்டலங்கள் & நேரம் (Delivery Coverage & Timelines)' : currentLang === 'ml' ? '📍 ഡെലിവറി ഏരിയകൾ' : '📍 Delivery Coverage & Timelines',
              body: currentLang === 'ta'
                ? '• காலை 8:00 மணி வரை செய்யப்படும் ஆர்டர்கள் அன்றைய தினமே (Same-day Delivery) மாலை 5:00 மணிக்கு முன் விநியோகம் செய்யப்படும்.\n• பண்ணையிலிருந்து நேரடியாக 30 கி.மீ சுற்றளவுக்குள் விரைவு டெலிவரி செய்யப்படுகிறது.'
                : currentLang === 'ml'
                ? '• രാവിലെ 8 മണിക്ക് മുൻപുള്ള ഓർഡറുകൾ അന്ന് തന്നെ ഡെലിവറി ചെയ്യും.\n• 30 കി.മീ ചുറ്റളവിൽ സേവനം ലഭ്യമാണ്.'
                : '• Same-day delivery for orders placed before 8:00 AM.\n• Service available across a 30 km radius from registered partner farms.',
            },
          ],
        };

      case 'agreement':
        return {
          title: currentLang === 'ta' ? 'விவசாயி / விற்பனையாளர் ஒப்பந்தம் (Seller Agreement)' : currentLang === 'ml' ? 'കർഷക കരാർ' : 'Farmer & Seller Agreement',
          lastUpdated: 'Updated: September 2026',
          intro: currentLang === 'ta'
            ? 'Zunkako தளத்தில் காய்கறிகள் மற்றும் பழங்களை விற்பனை செய்யும் விவசாயிகளுக்கான கமிஷன் மற்றும் செட்டில்மென்ட் விதிகள்.'
            : currentLang === 'ml'
            ? 'കർഷകർക്കുള്ള കമ്മീഷൻ, പേയ്‌മെന്റ് നിയമങ്ങൾ.'
            : 'Operational terms, commission structures, and payout schedules for registered Zunkako farmers.',
          sections: [
            {
              title: currentLang === 'ta' ? '🧑‍🌾 விவசாயி பொறுப்புகள் (Farmer Obligations)' : currentLang === 'ml' ? '🧑‍🌾 കർഷകന്റെ ബാധ്യതകൾ' : '🧑‍🌾 Farmer Obligations',
              body: currentLang === 'ta'
                ? '• தயாரிப்புகளின் தரம், அளவு மற்றும் சரியான எடைக்கு விவசாயியே முழுப் பொறுப்பு.\n• விவசாயி தனது ஆதார் / அரசு அடையாள அட்டையை சமர்ப்பித்து கணக்கை உறுதிப்படுத்த வேண்டும்.'
                : currentLang === 'ml'
                ? '• ഉൽപ്പന്നങ്ങളുടെ ഗുണനിലവാരത്തിന് കർഷകൻ ഉത്തരവാദിയാണ്.'
                : '• Farmer is 100% responsible for crop quality, accurate weight, and fresh harvest delivery.\n• Mandatory ID verification (Aadhaar / Farmer ID) required prior to listing.',
            },
            {
              title: currentLang === 'ta' ? '💰 கமிஷன் & 7-நாள் செட்டில்மென்ட் (Commission & 7-Day Payout)' : currentLang === 'ml' ? '💰 കമ്മീഷനും പേയ്‌മെന്റും' : '💰 Commission & Payout Terms',
              body: currentLang === 'ta'
                ? '• Zunkako தளம் வெற்றிபெறும் ஒவ்வொரு விற்பனையிலிருந்தும் 8% கமிஷன் சேவைக் கட்டணமாகப் பெறுகிறது.\n• விற்பனைத் தொகை நுகர்வோருக்கு டெலிவரி செய்யப்பட்ட 7 நாட்களுக்குள் விவசாயியின் வங்கிக் கணக்கிற்கு நேரடியாக அணுப்பப்படும்.'
                : currentLang === 'ml'
                ? '• 8% കമ്മീഷൻ ഈടാക്കുന്നു. 7 ദിവസത്തിനുള്ളിൽ ബാങ്ക് അക്കൗണ്ടിലേക്ക് തുക എത്തും.'
                : '• Zunkako charges a standard 8% platform fee per successful sale.\n• Net sales payouts are deposited directly to the farmer\'s bank account within 7 business days post-delivery.',
            },
          ],
        };

      case 'licenses':
        return {
          title: currentLang === 'ta' ? 'திறந்த மூல உரிமங்கள் (Open Source Licenses)' : currentLang === 'ml' ? 'ഓപ്പൺ സോഴ്സ് ലൈസൻസുകൾ' : 'Open Source Licenses',
          lastUpdated: 'Zunkako Mobile App Dependencies',
          intro: currentLang === 'ta'
            ? 'Zunkako மொபைல் செயலியை உருவாக்க பயன்பட்ட திறந்த மூல மென்பொருள் உரிமங்களின் பட்டியல் கீழே வழங்கப்பட்டுள்ளது.'
            : currentLang === 'ml'
            ? 'Zunkako ആപ്പിൽ ഉപയോഗിച്ചിരിക്കുന്ന ഓപ്പൺ സോഴ്സ് ലൈബ്രറികൾ.'
            : 'Zunkako Mobile App utilizes the following open-source software libraries under MIT and Apache 2.0 licenses:',
          isLicenses: true,
        };

      case 'terms':
      default:
        return {
          title: currentLang === 'ta' ? 'Zunkako சேவை விதிமுறைகள் (Terms & Conditions)' : currentLang === 'ml' ? 'Zunkako ഉപയോഗ നിബന്ധനകൾ' : 'Terms & Conditions',
          lastUpdated: 'Updated: September 2026',
          intro: currentLang === 'ta'
            ? 'Zunkako செயலியைப் பயன்படுத்துவதன் மூலம் நீங்கள் இந்த சேவை விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.'
            : currentLang === 'ml'
            ? 'Zunkako ഉപയോഗിക്കുന്നതിലൂടെ നിങ്ങൾ ഈ നിബന്ധനകൾ അംഗീകരിക്കുന്നു.'
            : 'By using the Zunkako mobile application, you agree to comply with and be bound by the following terms.',
          sections: [
            {
              title: currentLang === 'ta' ? '1. தகுதி & கணக்கு பாதுகாப்பு (Eligibility & Account Rules)' : currentLang === 'ml' ? '1. യോഗ്യത' : '1. Eligibility & User Accounts',
              body: currentLang === 'ta'
                ? '• பயனர் 18 வயது நிறைவடைந்தவராக இருக்க வேண்டும்.\n• சரியான மொபைல் எண் மற்றும் விவரங்களை வழங்க வேண்டும்.\n• போலி கணக்குகள் உருவாக்கினால் கணக்கு முடக்கப்படும்.'
                : currentLang === 'ml'
                ? '• 18 വയസ്സ് പൂർത്തിയായിരിക്കണം.\n• വ്യാജ അക്കൗണ്ടുകൾ പാടില്ല.'
                : '• Users must be at least 18 years old.\n• Registration requires valid mobile phone verification.\n• Fake profiles or proxy accounts are strictly prohibited.',
            },
            {
              title: currentLang === 'ta' ? '2. சந்தை விதிகள் (Marketplace & Payment Rules)' : currentLang === 'ml' ? '2. മാർക്കറ്റ് നിയമങ്ങൾ' : '2. Marketplace Transactions',
              body: currentLang === 'ta'
                ? '• நுகர்வோர் ஆர்டர் செய்த தொகையை டெலிவரி நேரத்திலோ அல்லது ஆன்லைனிலோ செலுத்த வேண்டும்.\n• விவசாயி தரமான காய்கறிகளை மட்டுமே விநியோகிக்க வேண்டும்.'
                : currentLang === 'ml'
                ? '• ഉപഭോക്താവ് കൃത്യമായി തുക അടയ്ക്കണം.'
                : '• Consumers must pay the full agreed amount upon delivery or online checkout.\n• Farmers must guarantee accurate crop weights and fresh non-spoiled condition.',
            },
          ],
        };
    }
  };

  const content = getPolicyContent();
  const bg = isDark ? '#121212' : COLORS.background;
  const cardBg = isDark ? '#1E1E1E' : COLORS.white;
  const textColor = isDark ? '#FFFFFF' : COLORS.textPrimary;
  const subColor = isDark ? '#AAAAAA' : '#666666';
  const borderColor = isDark ? '#333333' : COLORS.borderLight;

  // Search Filter
  const filteredSections = (content.sections || []).filter(sec => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.body.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {content.title}
        </Text>
        <TouchableOpacity
          onPress={() => setReportModalVisible(true)}
          style={styles.headerReportBtn}
        >
          <Text style={styles.headerReportBtnText}>🛡️</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Policy Selector Tabs */}
      <View style={styles.tabScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {POLICY_TYPES.map(p => {
            const isActive = activeType === p.id;
            const label = currentLang === 'ta' ? p.titleTa : currentLang === 'ml' ? p.titleMl : p.titleEn;

            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => {
                  setActiveType(p.id);
                  setSearchQuery('');
                  setExpandedSections({});
                }}
              >
                <Text style={styles.tabIcon}>{p.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: cardBg, color: textColor, borderColor }]}
          placeholder={
            currentLang === 'ta'
              ? '🔍 தேடுக (எ.கா. data, refund, delivery...)'
              : currentLang === 'ml'
              ? '🔍 തിരയുക...'
              : '🔍 Search policy clauses (e.g. data, refund, delivery...)'
          }
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.lastUpdated}>{content.lastUpdated}</Text>
          <Text style={[styles.introText, { color: textColor }]}>{content.intro}</Text>
        </View>

        {/* Licenses List View */}
        {content.isLicenses ? (
          <View style={styles.licensesContainer}>
            {OPEN_SOURCE_PACKAGES.map((pkg, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.licenseCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => Linking.openURL(pkg.url).catch(() => {})}
              >
                <View style={styles.licenseHeader}>
                  <Text style={[styles.licenseName, { color: textColor }]}>{pkg.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pkg.license}</Text>
                  </View>
                </View>
                <Text style={[styles.licenseDesc, { color: subColor }]}>{pkg.desc}</Text>
                <Text style={styles.licenseUrl}>🔗 {pkg.url}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Accordion Policy Sections */
          <View style={styles.sectionsContainer}>
            {filteredSections.map((sec, idx) => {
              const isExpanded = expandedSections[idx] !== false; // Default open for readability

              return (
                <View
                  key={idx}
                  style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}
                >
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleSection(idx)}
                  >
                    <Text style={[styles.accordionTitle, { color: textColor }]}>
                      {sec.title}
                    </Text>
                    <Text style={styles.accordionArrow}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.accordionBodyWrap}>
                      <Text style={[styles.accordionBodyText, { color: textColor }]}>
                        {sec.body}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {filteredSections.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: subColor }]}>
                  {currentLang === 'ta'
                    ? 'பொருந்தும் விதிகள் எதுவும் கிடைக்கவில்லை.'
                    : 'No matching clauses found.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Support & Moderation Card */}
        <View style={styles.contactFooter}>
          <Text style={styles.contactTitle}>✉️ Contact Legal & Moderation Support</Text>
          <Text style={styles.contactSub}>zunkakoapp@gmail.com | Phone: 9360425423</Text>
        </View>
      </ScrollView>

      {/* Content Moderation Report Modal */}
      <ContentReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        contentType="policy"
        targetTitle={content.title}
      />
    </View>
  );
};

export default LegalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: rs(16),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.xs,
  },
  headerReportBtn: {
    padding: SPACING.xs,
  },
  headerReportBtnText: {
    fontSize: 20,
  },
  tabScrollWrap: {
    backgroundColor: '#0D5C32',
    paddingVertical: 8,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: COLORS.white,
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#0D5C32',
    fontWeight: 'bold',
  },
  searchBarWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 13,
  },
  scrollBody: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  introCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#1B8A4E',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  introText: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionsContainer: {
    marginBottom: SPACING.md,
  },
  accordionCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(27, 138, 78, 0.05)',
  },
  accordionTitle: {
    fontSize: rs(14),
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  accordionArrow: {
    fontSize: 12,
    color: '#1B8A4E',
  },
  accordionBodyWrap: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  accordionBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  licensesContainer: {
    marginBottom: SPACING.md,
  },
  licenseCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  licenseName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  licenseDesc: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 17,
  },
  licenseUrl: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  contactFooter: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: SPACING.md,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D5C32',
  },
  contactSub: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  emptyWrap: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
