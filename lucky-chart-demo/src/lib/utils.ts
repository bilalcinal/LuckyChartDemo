// Rastgele OTP kodu oluşturma fonksiyonu
export function generateOTP(length: number = 6): string {
  let otp = '';
  const digits = '0123456789';

  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return otp;
}

// OTP kodunun geçerlilik süresini ayarlama
export function getOTPExpiry(): Date {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10); // 10 dakika geçerli
  return expires;
} 