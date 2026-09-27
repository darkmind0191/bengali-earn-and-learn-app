import {
  AdMob,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

const REWARDED_AD_ID =
  'ca-app-pub-7724637834567497/4602473415';

type RewardedAdResult = {
  success: boolean;
  message: string;
};

export async function showRewardedAd(): Promise<RewardedAdResult> {
  let rewarded = false;
  let listener: { remove: () => Promise<void> } | null = null;

  try {
    listener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      () => {
        rewarded = true;
      }
    );

    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: false,
    });

    await AdMob.showRewardVideoAd();

    // Reward event পাওয়ার জন্য সামান্য অপেক্ষা
    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    if (rewarded) {
      return {
        success: true,
        message: 'বিজ্ঞাপন সম্পূর্ণ হয়েছে।',
      };
    }

    return {
      success: false,
      message: 'বিজ্ঞাপন সম্পূর্ণ করা হয়নি।',
    };
  } catch (error) {
    console.error('Rewarded Ad error:', error);

    return {
      success: false,
      message: 'বিজ্ঞাপন চালু করা যায়নি। আবার চেষ্টা করুন।',
    };
  } finally {
    if (listener) {
      await listener.remove();
    }
  }
}

export async function watchAdForLife(): Promise<boolean> {
  const result = await showRewardedAd();

  return result.success;
}