import React from 'react';
import {View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../context/ThemeContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const LegalScreen = ({route, navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const {type} = route.params || {type: 'terms'};
  const currentLang = i18n.language || 'ta';

  // Localized Content Data
  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: t('legal.privacy', {defaultValue: 'Privacy Policy'}),
          sections: [
            {
              title:
                currentLang === 'ta'
                  ? '✓ நாம் சேகரிக்கும் தகவல்கள்'
                  : currentLang === 'ml'
                  ? '✓ ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങൾ'
                  : '✓ INFORMATION WE COLLECT',
              body:
                currentLang === 'ta'
                  ? 'நாங்கள் சேகரிப்பது:\n• பெயர், மின்னஞ்சல், தொலைபேசி எண்\n• இருப்பிடத் தரவு (GPS)\n• ஆர்டர் வரலாறு\n• பணம் செலுத்திய விவரங்கள்\n• சாதன விவரங்கள்'
                  : currentLang === 'ml'
                  ? 'ഞങ്ങൾ ശേഖരിക്കുന്നത്:\n• പേര്, ഇമെയിൽ, ഫോൺ നമ്പർ\n• ലൊക്കേഷൻ വിവരങ്ങൾ (GPS)\n• ഓർഡർ ഹിസ്റ്ററി\n• പേയ്‌മെന്റ് വിവരങ്ങൾ\n• ഉപകരണ വിവരങ്ങൾ'
                  : 'We collect:\n• Name, email, phone number\n• Location data (GPS)\n• Order history\n• Payment information\n• Device information',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ உங்கள் தரவை நாம் எவ்வாறு பயன்படுத்துகிறோம்'
                  : currentLang === 'ml'
                  ? '✓ ഞങ്ങൾ നിങ്ങളുടെ വിവരങ്ങൾ എങ്ങനെ ഉപയോഗിക്കുന്നു'
                  : '✓ HOW WE USE YOUR DATA',
              body:
                currentLang === 'ta'
                  ? '• ஆர்டர்களைச் செயல்படுத்த\n• அறிவிப்புகளை அனுப்ப\n• எங்கள் சேவையை மேம்படுத்த\n• மோசடிகளைத் தடுக்க'
                  : currentLang === 'ml'
                  ? '• ഓർഡറുകൾ പ്രോസസ്സ് ചെയ്യാൻ\n• അറിയിപ്പുകൾ അയക്കാൻ\n• ഞങ്ങളുടെ സേവനം മെച്ചപ്പെടുത്താൻ\n• തട്ടിപ്പുകൾ തടയാൻ'
                  : '• To process orders\n• To send notifications\n• To improve our service\n• To prevent fraud',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ தரவு பகிர்வு'
                  : currentLang === 'ml'
                  ? '✓ വിവരങ്ങൾ പങ്കിടൽ'
                  : '✓ DATA SHARING',
              body:
                currentLang === 'ta'
                  ? 'நாங்கள் தரவை யாருடன் பகிர்கிறோம்:\n• விவசாயிகள் (ஆர்டர்களை வழங்க)\n• விநியோக கூட்டாளர்கள்\n• கட்டணச் செயலிகள்\n• மூன்றாம் தரப்பினருக்கு விற்கப்படாது ✅'
                  : currentLang === 'ml'
                  ? 'ഞങ്ങൾ വിവരങ്ങൾ പങ്കിടുന്നത്:\n• കർഷകർ (ഓർഡർ പൂർത്തിയാക്കാൻ)\n• ഡെലിവറി പാർട്ണർമാർ\n• പേയ്‌മെന്റ് പ്രോസസ്സറുകൾ\n• മൂന്നാം കക്ഷികൾക്ക് വിൽക്കില്ല ✅'
                  : 'We share data with:\n• Farmers (for order fulfillment)\n• Delivery partners\n• Payment processors\n• NOT sold to third parties ✅',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ இருப்பிடத் தரவு'
                  : currentLang === 'ml'
                  ? '✓ ലൊക്കേഷൻ വിവരങ്ങൾ'
                  : '✓ LOCATION DATA',
              body:
                currentLang === 'ta'
                  ? '• விநியோக நோக்கங்களுக்காக மட்டுமே பயன்படுத்தப்படுகிறது\n• விவசாயி இருப்பிடம் நுகர்வோருக்கு காட்டப்படும்\n• நுகர்வோர் இருப்பிடம் டெலிவரி பார்ட்னருடன் பகிரப்படும்'
                  : currentLang === 'ml'
                  ? '• ഡെലിവറി ആവശ്യങ്ങൾക്ക് മാത്രം ഉപയോഗിക്കുന്നു\n• കർഷകന്റെ ലൊക്കേഷൻ ഉപഭോക്താക്കൾക്ക് കാണിക്കുന്നു\n• ഉപഭോക്താവിന്റെ ലൊക്കേഷൻ ഡെലിവറിയുമായി പങ്കിടുന്നു'
                  : '• Used only for delivery purposes\n• Farmer location shown to consumers\n• Consumer location shared with delivery',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ தரவு பாதுகாப்பு'
                  : currentLang === 'ml'
                  ? '✓ വിവര സുരക്ഷ'
                  : '✓ DATA SECURITY',
              body:
                currentLang === 'ta'
                  ? '• பயர்பேஸ் குறியாக்கம் (Firebase encryption)\n• பாதுகாப்பான இணைப்புகள் (HTTPS)\n• வழக்கமான பாதுகாப்பு மேம்படுத்தல்கள்'
                  : currentLang === 'ml'
                  ? '• ഫയർബേസ് എൻക്രിപ്ഷൻ\n• സുരക്ഷിത കണക്ഷനുകൾ (HTTPS)\n• പതിവ് സുരക്ഷാ അപ്‌ഡേറ്റുകൾ'
                  : '• Firebase encryption\n• Secure connections (HTTPS)\n• Regular security updates',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ உங்கள் உரிமைகள்'
                  : currentLang === 'ml'
                  ? '✓ നിങ്ങളുടെ അവകാശങ്ങൾ'
                  : '✓ YOUR RIGHTS',
              body:
                currentLang === 'ta'
                  ? '• உங்கள் கணக்கை எப்போது வேண்டுமானாலும் நீக்கலாம்\n• உங்கள் தரவை எங்களிடம் கோரலாம்\n• விளம்பர செய்திகளை தவிர்க்கலாம் (Opt-out)'
                  : currentLang === 'ml'
                  ? '• അക്കൗണ്ട് എപ്പോൾ വേണമെങ്കിലും ഇല്ലാതാക്കാം\n• നിങ്ങളുടെ വിവരങ്ങൾ ആവശ്യപ്പെടാം\n• പരസ്യ സന്ദേശങ്ങൾ ഒഴിവാക്കാം'
                  : '• Delete your account anytime\n• Request your data\n• Opt-out of marketing',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ குழந்தைகள் தனியுரிமை'
                  : currentLang === 'ml'
                  ? '✓ കുട്ടികളുടെ സ്വകാര്യത'
                  : "✓ CHILDREN'S PRIVACY",
              body:
                currentLang === 'ta'
                  ? '• இந்த செயலி 18 வயதுக்கு உட்பட்டவர்களுக்கானது அல்ல\n• 18 வயதுக்கு கீழ் உள்ளவர்களின் தரவை நாங்கள் சேகரிப்பதில்லை'
                  : currentLang === 'ml'
                  ? '• ആപ്പ് 18 വയസ്സിന് താഴെയുള്ളവർക്കായി ഉദ്ദേശിച്ചുള്ളതല്ല\n• കുട്ടികളുടെ വിവരങ്ങൾ ഞങ്ങൾ ശേഖരിക്കുന്നില്ല'
                  : "• App not intended for under 18\n• We don't knowingly collect children's data",
            },
            {
              title:
                currentLang === 'ta'
                  ? '✉️ எங்களைத் தொடர்பு கொள்ள'
                  : currentLang === 'ml'
                  ? '✉️ ഞങ്ങളെ ബന്ധപ്പെടാൻ'
                  : '✉️ CONTACT US',
              body: 'zunkakoapp@gmail.com\nPhone: 9360425423, 9585475247',
            },
          ],
        };

      case 'licenses':
        return {
          title: t('legal.licenses', {defaultValue: 'Open Source Licenses'}),
          sections: [
            {
              title: 'MIT License (Free to use)',
              body: '✅ React Native - Facebook\n✅ React Navigation - React Native Community\n✅ Cloudinary SDK\n✅ react-native-maps\n✅ React Native Vector Icons\n✅ Axios\n✅ React Native Paper\n✅ React Native Video\n✅ React Native QRCode Scanner\n✅ React Native Flash Message\n✅ React Native Linear Gradient\n✅ React Native Async Storage\n✅ React Native Reanimated\n✅ React Native Gesture Handler\n✅ React Native Safe Area Context\n✅ React Native Screens\n✅ i18next\n✅ Lodash\n✅ Moment.js',
            },
            {
              title: 'Apache License 2.0',
              body: '✅ Firebase SDK - Google\n✅ Android SDK - Google',
            },
          ],
        };

      case 'refund':
        return {
          title: t('legal.refund', {
            defaultValue: 'Refund & Cancellation Policy',
          }),
          sections: [
            {
              title:
                currentLang === 'ta'
                  ? '✓ ஆர்டர் ரத்து கொள்கை'
                  : currentLang === 'ml'
                  ? '✓ ഓർഡർ റദ്ദാക്കൽ നയം'
                  : '✓ CANCELLATION POLICY',
              body:
                currentLang === 'ta'
                  ? '• தயாரிப்புகள் அனுப்பப்படுவதற்கு முன் ரத்து செய்தால்: முழு பணமும் திரும்ப வழங்கப்படும் (Full refund).\n• தயாரிப்புகள் அனுப்பப்பட்ட பின் ரத்து செய்தால்: பகுதி பணம் மட்டுமே வழங்கப்படும் (டெலிவரி கட்டணம் கழிக்கப்படும்).'
                  : currentLang === 'ml'
                  ? '• സാധനം അയക്കുന്നതിന് മുമ്പ് റദ്ദാക്കിയാൽ: മുഴുവൻ തുകയും തിരികെ നൽകും.\n• സാധനം അയച്ചതിന് ശേഷം റദ്ദാക്കിയാൽ: ഡെലിവറി തുക കുറച്ചതിന് ശേഷം ബാക്കി തുക നൽകും.'
                  : '• Order cancellation before dispatch: Full refund.\n• Order cancellation after dispatch: Partial refund (minus delivery cost).',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ திரும்பப்பெறும் கொள்கை (Refund Policy)'
                  : currentLang === 'ml'
                  ? '✓ റീഫണ്ട് നയം'
                  : '✓ REFUND POLICY',
              body:
                currentLang === 'ta'
                  ? '• சேதமடைந்த அல்லது அழுகிய பொருட்கள் வழங்கப்பட்டால்: 2 நாட்களுக்குள் முறையிட்டால் முழு பணம் திரும்ப வழங்கப்படும் அல்லது மாற்றுப் பொருள் தரப்படும்.\n• தவறான பொருள் டெலிவரி செய்யப்பட்டால்: 2 நாட்களுக்குள் முறையிட்டால் முழு பணமும் திரும்ப வழங்கப்படும்.\n• வாடிக்கையாளரின் மனம் மாறுதல் காரணமாக (Change of mind) பணம் திரும்ப வழங்கப்பட மாட்டாது.'
                  : currentLang === 'ml'
                  ? '• കേടുപാടുകൾ സംഭവിച്ച ഉൽപ്പന്നങ്ങൾ: 2 ദിവസത്തിനുള്ളിൽ മുഴുവൻ റീഫണ്ട് ലഭിക്കും.\n• തെറ്റായ ഉൽപ്പന്നങ്ങൾ: 2 ദിവസത്തിനുള്ളിൽ മുഴുവൻ റീഫണ്ട് ലഭിക്കും.\n• ഉപഭോക്താവിന്റെ അഭിപ്രായം മാറിയാൽ: റീഫണ്ട് നൽകില്ല.'
                  : '• Damaged products: Full refund or replacement within 2 days.\n• Wrong product delivered: Full refund within 2 days.\n• Customer change of mind: No refund.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ டெலிவரி தாமதம்'
                  : currentLang === 'ml'
                  ? '✓ ഡെലിവറി താമസം'
                  : '✓ DELIVERY DELAYS',
              body:
                currentLang === 'ta'
                  ? '• வாக்குறுதி அளிக்கப்பட்ட நேரத்திற்குள் தயாரிப்பு டெலிவரி செய்யப்படவில்லை எனில்: நுகர்வோர் முழு பணத்தையும் திரும்பக் கோரலாம்.'
                  : currentLang === 'ml'
                  ? '• വാഗ്ദാനം ചെയ്ത സമയത്തിനുള്ളിൽ സാധനം ലഭിച്ചില്ലെങ്കിൽ: മുഴുവൻ തുകയും റീഫണ്ട് ചെയ്യും.'
                  : '• Product not delivered within promised time: Full refund.',
            },
          ],
        };

      case 'agreement':
        return {
          title: t('legal.agreement', {
            defaultValue: 'Seller/Farmer Agreement',
          }),
          sections: [
            {
              title:
                currentLang === 'ta'
                  ? '✓ விவசாயி பொறுப்புகள்'
                  : currentLang === 'ml'
                  ? '✓ കർഷകന്റെ ഉത്തരവാദിത്തങ്ങൾ'
                  : '✓ FARMER RESPONSIBILITIES',
              body:
                currentLang === 'ta'
                  ? '• தயாரிப்புகளின் தரம், அளவு மற்றும் துல்லியமான விவரங்களுக்கு விவசாயியே முழுப் பொறுப்பு.\n• விவசாயி தனது அடையாளத்தை உறுதிப்படுத்த செல்லுபடியாகும் அடையாள அட்டையை (ID Proof) சமர்ப்பிக்க வேண்டும்.\n• விவசாயியின் தயாரிப்பு தரம் தொடர்பான புகார்களுக்கு Zunkako தளம் பொறுப்பேற்காது.'
                  : currentLang === 'ml'
                  ? '• ഉൽപ്പന്നങ്ങളുടെ ഗുണനിലവാരം, അളവ്, വിവരണം എന്നിവയ്ക്ക് കർഷകൻ മാത്രമായിരിക്കും ഉത്തരവാദി.\n• ഐഡന്റിറ്റി സ്ഥിരീകരിക്കാൻ സാധുവായ തിരിച്ചറിയൽ രേഖ നൽകേണ്ടതുണ്ട്.\n• ഉൽപ്പന്നങ്ങളുടെ ഗുണനിലവാര തർക്കങ്ങളിൽ Zunkako ഉത്തരവാദിയല്ല.'
                  : "• Farmer is fully responsible for product quality, quantity, and accurate description.\n• Farmer must provide valid ID proof for identity verification.\n• Zunkako is not liable for farmer's product quality disputes.",
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ கமிஷன் மற்றும் கட்டணங்கள்'
                  : currentLang === 'ml'
                  ? '✓ കമ്മീഷനും സെറ്റിൽമെന്റും'
                  : '✓ COMMISSION & SETTLEMENT',
              body:
                currentLang === 'ta'
                  ? '• Zunkako தளம் ஒவ்வொரு விற்பனையிலிருந்தும் 8% கமிஷன் கட்டணமாக வசூலிக்கும்.\n• விற்பனைத் தொகை நுகர்வோருக்கு டெலிவரி செய்யப்பட்ட 7 நாட்களுக்குள் விவசாயியின் கணக்கில் செட்டில் செய்யப்பட வேண்டும்.'
                  : currentLang === 'ml'
                  ? '• Zunkako ഓരോ വിൽപ്പനയിൽ നിന്നും 8% കമ്മീഷൻ ഈടാക്കും.\n• ഡെലിവറി കഴിഞ്ഞ് 7 ദിവസത്തിനുള്ളിൽ പേയ്‌മെന്റ് തീർപ്പാക്കും.'
                  : '• Zunkako charges 8% commission per successful sale.\n• Payment settlement will be completed within 7 days after successful delivery.',
            },
          ],
        };

      case 'terms':
      default:
        return {
          title: t('legal.terms', {defaultValue: 'Terms & Conditions'}),
          sections: [
            {
              title:
                currentLang === 'ta'
                  ? '✓ ஏற்புத்தன்மை (Acceptance)'
                  : currentLang === 'ml'
                  ? '✓ സ്വീകാര്യത'
                  : '✓ ACCEPTANCE',
              body:
                currentLang === 'ta'
                  ? 'Zunkako செயலியைப் பயன்படுத்துவதன் மூலம், இந்த விதிமுறைகளை நீங்கள் ஏற்றுக்கொள்கிறீர்கள்.'
                  : currentLang === 'ml'
                  ? 'Zunkako ആപ്ലിക്കേഷൻ ഉപയോഗിക്കുന്നതിലൂടെ, നിങ്ങൾ ഈ നിബന്ധനകൾ അംഗീകരിക്കുന്നു.'
                  : 'By using the Zunkako application, you agree to these terms.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ தகுதி (Eligibility)'
                  : currentLang === 'ml'
                  ? '✓ യോഗ്യത'
                  : '✓ ELIGIBILITY',
              body:
                currentLang === 'ta'
                  ? '• 18 வயது அல்லது அதற்கு மேற்பட்டவராக இருக்க வேண்டும்\n• இந்திய குடியிருப்பாளராக இருக்க வேண்டும்\n• சரியான தொலைபேசி எண் தேவை'
                  : currentLang === 'ml'
                  ? '• 18 വയസ്സിന് മുകളിൽ പ്രായമുണ്ടായിരിക്കണം\n• ഇന്ത്യൻ താമസക്കാരനായിരിക്കണം\n• സാധുവായ ഫോൺ നമ്പർ ആവശ്യമാണ്'
                  : '• Must be 18+ years old\n• Must be an Indian resident\n• Valid phone number required',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ விவசாயிகளின் கடமைகள்'
                  : currentLang === 'ml'
                  ? '✓ കർഷകന്റെ ബാധ്യതകൾ'
                  : '✓ FARMER OBLIGATIONS',
              body:
                currentLang === 'ta'
                  ? '• உண்மையான விவசாயப் பொருட்களை மட்டுமே விற்க வேண்டும்\n• பொருட்கள் புதியதாகவும் பாதுகாப்பானதாகவும் இருக்க வேண்டும்\n• துல்லியமான தயாரிப்பு விவரங்கள் வழங்கப்பட வேண்டும்\n• FSSAI பதிவு பரிந்துரைக்கப்படுகிறது'
                  : currentLang === 'ml'
                  ? '• യഥാർത്ഥ കാർഷിക ഉൽപ്പന്നങ്ങൾ മാത്രം വിൽക്കുക\n• ഉൽപ്പന്നങ്ങൾ പുതിയതും സുരക്ഷിതവുമായിരിക്കണം\n• കൃത്യമായ വിവരണം നൽകണം\n• FSSAI രജിസ്ട്രേഷൻ ശുപാർശ ചെയ്യുന്നു'
                  : '• Only sell genuine farm products\n• Products must be fresh and safe\n• Accurate product descriptions required\n• FSSAI registration recommended',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ நுகர்வோர் கடமைகள்'
                  : currentLang === 'ml'
                  ? '✓ ഉപഭോക്തൃ ബാധ്യതകൾ'
                  : '✓ CONSUMER OBLIGATIONS',
              body:
                currentLang === 'ta'
                  ? '• சரியான விநியோக முகவரியை வழங்க வேண்டும்\n• டெலிவரி செய்யும் போது ஒப்புக்கொண்ட தொகையை செலுத்த வேண்டும்\n• உண்மையான கருத்துக்கள் (Reviews) மட்டுமே எழுத வேண்டும்'
                  : currentLang === 'ml'
                  ? '• കൃത്യമായ ഡെലിവറി വിലാസം നൽകുക\n• ഡെലിവറി സമയത്ത് തുക നൽകുക\n• യഥാർത്ഥ അവലോകനങ്ങൾ മാത്രം നൽകുക'
                  : '• Provide accurate delivery address\n• Pay agreed amount on delivery\n• Genuine reviews only',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ கமிஷன் மற்றும் டெலிவரி கட்டணங்கள்'
                  : currentLang === 'ml'
                  ? '✓ കമ്മീഷനും ഡെലിവറി ഫീസും'
                  : '✓ COMMISSION & DELIVERY FEES',
              body:
                currentLang === 'ta'
                  ? '• Zunkako தளம் ஒரு விற்பனைக்கு 8% கமிஷன் வசூலிக்கும்.\n• டெலிவரி கட்டணம்: முதல் 3 மாதங்கள் முற்றிலும் இலவசம் (எந்தவொரு சந்தா அல்லது டெலிவரி கட்டணமும் கிடையாது). இந்த 3 மாத காலத்திற்குப் பிறகு, ஒவ்வொரு ஆர்டர் அல்லது பொருளுக்கும் ₹20 விநியோகக் கட்டணம் வசூலிக்கப்படும் (₹500க்குக் கீழ் உள்ள ஆர்டர்களுக்கு).\n• ₹500க்கு மேல் உள்ள ஆர்டர்களுக்கு டெலிவரி முற்றிலும் இலவசம்.'
                  : currentLang === 'ml'
                  ? '• Zunkako ഓരോ വിൽപ്പനയ്ക്കും 8% കമ്മീഷൻ ഈടാക്കും.\n• ഡെലിവറി ഫീസ്: ആദ്യ മൂന്ന് മാസം പൂർണ്ണമായും സൌജന്യമാണ്. ഈ 3 മാസത്തിന് ശേഷം, ₹500-ൽ താഴെയുള്ള ഓർഡറുകൾക്ക് ₹20 ഡെലിവറി ഫീസ് ഈടാക്കും.\n• ₹500-ന് മുകളിലുള്ള ഓർഡറുകൾക്ക് സൌജന്യ ഡെലിവറി.'
                  : '• Zunkako charges 8% commission per sale.\n• Delivery fee: First three months, the service is completely free (no subscription or delivery charges). After this 3-month period ends, you will be charged ₹20 for the delivery of each order or item (for orders below ₹500).\n• Free delivery above ₹500.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ திரும்பப்பெறும் கொள்கை (Refund Policy)'
                  : currentLang === 'ml'
                  ? '✓ റീഫണ്ട് നയം'
                  : '✓ REFUND POLICY',
              body:
                currentLang === 'ta'
                  ? '• சேதமடைந்த தயாரிப்புகள்: 2 நாட்களுக்குள் முழு பணமும் திரும்பத் தரப்படும்\n• தவறான தயாரிப்பு: 2 நாட்களுக்குள் முழு பணமும் திரும்பத் தரப்படும்\n• வாடிக்கையாளர் மனம் மாறுதல் காரணமாக பணம் திரும்பத் தரப்பட மாட்டாது'
                  : currentLang === 'ml'
                  ? '• കേടുപാടുകൾ സംഭവിച്ച ഉൽപ്പന്നങ്ങൾ: 2 ദിവസത്തിനുള്ളിൽ മുഴുവൻ റീഫണ്ട്\n• തെറ്റായ ഉൽപ്പന്നങ്ങൾ: 2 ദിവസത്തിനുള്ളിൽ മുഴുവൻ റീഫണ്ട്\n• ഉപഭോക്താവിന്റെ അഭിപ്രായം മാറിയാൽ റീഫണ്ട് ഇല്ല'
                  : '• Damaged products: Full refund within 2 days\n• Wrong product: Full refund within 2 days\n• Customer change of mind: No refund',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ பதிப்புரிமைக் கொள்கை (DMCA)'
                  : currentLang === 'ml'
                  ? '✓ പകർപ്പവകാശ നയം (DMCA)'
                  : '✓ COPYRIGHT POLICY (DMCA)',
              body:
                currentLang === 'ta'
                  ? '• பயனர் பதிவேற்றும் படங்கள் மற்றும் வீடியோக்கள் சொந்தமானதாகவோ அல்லது அனுமதி பெற்றதாகவோ இருக்க வேண்டும்.\n• ஏதேனும் பதிப்புரிமை மீறல் இருந்தால், புகார் அளித்தவுடன் அது அகற்றப்படும்.\n• மீண்டும் மீண்டும் பதிப்புரிமை மீறுபவர்களின் கணக்கு இடைநீக்கம் செய்யப்படும்.'
                  : currentLang === 'ml'
                  ? '• ഉപയോക്താക്കൾ അപ്‌ലോഡ് ചെയ്യുന്ന ഫോട്ടോകൾ/വീഡിയോകൾ സ്വന്തം ഉത്തരവാദിത്തത്തിലായിരിക്കണം.\n• പകർപ്പവകാശ ലംഘനം ഉണ്ടായാൽ ആ വിവരങ്ങൾ നീക്കം ചെയ്യും.\n• നിയമലംഘനം തുടരുന്നവരുടെ അക്കൗണ്ടുകൾ റദ്ദാക്കും.'
                  : '• Users must own uploaded content or have permission.\n• Zunkako will remove infringing content upon receiving valid notice.\n• Repeat infringers will have their accounts terminated.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ தரம் பற்றிய பொறுப்புத் துறப்பு (Disclaimer)'
                  : currentLang === 'ml'
                  ? '✓ ബാധ്യതാ നിരാകരണം'
                  : '✓ DISCLAIMER OF WARRANTIES',
              body:
                currentLang === 'ta'
                  ? 'Zunkako என்பது விவசாயிகளையும் நுகர்வோரையும் இணைக்கும் ஒரு சந்தை (Marketplace) மட்டுமே. விவசாயிகள் பட்டியலிடும் தயாரிப்புகளின் தரம், புத்துணர்ச்சி அல்லது பாதுகாப்பிற்கு நாங்கள் பொறுப்பேற்க மாட்டோம். பயனர்கள் தங்கள் சொந்த பொறுப்பில் வாங்குகின்றனர்.'
                  : currentLang === 'ml'
                  ? 'Zunkako എന്നത് കർഷകരെയും ഉപഭോക്താക്കളെയും ബന്ധിപ്പിക്കുന്ന ഒരു പ്ലാറ്റ്ഫോം മാത്രമാണ്. ഉൽപ്പന്നങ്ങളുടെ ഗുണനിലവാരം അല്ലെങ്കിൽ സുരക്ഷയ്ക്ക് ഞങ്ങൾ ഉത്തരവാദികളല്ല.'
                  : 'Zunkako acts as a marketplace connecting farmers and consumers. We do not guarantee the quality, freshness, or safety of products listed by farmers. Users purchase at their own risk.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✓ ஆளும் சட்டம்'
                  : currentLang === 'ml'
                  ? '✓ ബാധകമായ നിയമം'
                  : '✓ GOVERNING LAW',
              body:
                currentLang === 'ta'
                  ? 'இந்த விதிமுறைகள் இந்திய சட்டங்களின்படி நிர்வகிக்கப்படும். இந்த செயலி தொடர்பான ஏதேனும் தகராறுகள் கோவை (Coimbatore, Tamil Nadu) நீதிமன்ற வரம்பிற்கு உட்பட்டது.'
                  : currentLang === 'ml'
                  ? 'ഈ നിബന്ധനകൾ ഇന്ത്യൻ നിയമങ്ങൾക്ക് വിധേയമായിരിക്കും. തർക്കങ്ങൾ കോയമ്പത്തൂർ കോടതികളുടെ പരിധിയിൽ വരുന്നതാണ്.'
                  : 'These Terms shall be governed by and construed in accordance with the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.',
            },
            {
              title:
                currentLang === 'ta'
                  ? '✉️ தொடர்பு விவரங்கள்'
                  : currentLang === 'ml'
                  ? '✉️ ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ'
                  : '✉️ CONTACT DETAILS',
              body: 'Email: zunkakoapp@gmail.com\nPhone: 9360425423, 9585475247\nOwner: Denish J',
            },
          ],
        };
    }
  };

  const {title, sections} = getContent();
  const bg = isDark ? '#121212' : COLORS.background;
  const cardBg = isDark ? '#1E1E1E' : COLORS.white;
  const textColor = isDark ? '#FFFFFF' : COLORS.textPrimary;
  const subColor = isDark ? '#AAAAAA' : COLORS.textSecondary;
  const borderColor = isDark ? '#333333' : COLORS.borderLight;

  return (
    <View style={[styles.container, {backgroundColor: bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {sections.map((sect, index) => (
          <View
            key={index}
            style={[
              styles.sectionCard,
              {backgroundColor: cardBg, borderColor},
            ]}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              {sect.title}
            </Text>
            <Text style={[styles.sectionBody, {color: subColor}]}>
              {sect.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: rs(40),
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  sectionBody: {
    fontSize: rs(FONTS.sm),
    lineHeight: rs(20),
  },
});

export default LegalScreen;
