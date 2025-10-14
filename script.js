document.addEventListener('DOMContentLoaded', () => {
  // 📌 DOM 元素初始化
  const form = document.getElementById('wa-form');
  const resultSection = document.getElementById('result');
  const waLinkInput = document.getElementById('wa-link');
  const copyButton = document.getElementById('copy-button');
  const phoneInput = document.getElementById('phone');
  const qrButton = document.getElementById('generate-qr-button');
  const shareButton = document.getElementById('share-button');
  const exportSection = document.getElementById('export-tools');
  const qrCanvas = document.getElementById('qrCanvas');
  const downloadQR = document.getElementById('downloadQR');
  const generateShortLink = document.getElementById('generateShortLink');
  const shortLinkOutput = document.getElementById('shortLinkOutput');
  const toggleBtn = document.getElementById('advancedToggle');
  const advancedBox = document.getElementById('advancedSettings');
  const toggleIcon = toggleBtn.querySelector('svg');
  const faqButtons = document.querySelectorAll('.faq-button');

  // ✅ 通用折叠函数：用于 FAQ 和 Advanced Settings
  function toggleSection(container, icon = null) {
    const isOpen = container.dataset.open === 'true';

    if (isOpen) {
      container.style.maxHeight = '0px';
      container.dataset.open = 'false';
      if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
      container.classList.remove('hidden');
      container.style.maxHeight = container.scrollHeight + 'px';
      container.dataset.open = 'true';
      if (icon) icon.style.transform = 'rotate(180deg)';
    }
  }

  // ✅ 初始化所有折叠区块（带 data-collapsible）
  const collapsibleSections = document.querySelectorAll('[data-collapsible]');
  collapsibleSections.forEach(section => {
    section.style.maxHeight = '0px';
    section.style.overflow = 'hidden';
    section.style.transition = 'max-height 0.3s ease';
    section.dataset.open = 'false';
  });

  // ✅ FAQ 折叠逻辑（只展开一个）
  faqButtons.forEach(button => {
    const content = button.nextElementSibling;
    const icon = button.querySelector('svg');

    button.addEventListener('click', () => {
      faqButtons.forEach(otherBtn => {
        const otherContent = otherBtn.nextElementSibling;
        const otherIcon = otherBtn.querySelector('svg');
        if (otherContent !== content && otherContent.dataset.open === 'true') {
          toggleSection(otherContent, otherIcon);
        }
      });

      toggleSection(content, icon);
    });
  });

  // ✅ Advanced Settings 折叠逻辑（复用 toggleSection）
  toggleBtn.addEventListener('click', () => {
    toggleSection(advancedBox, toggleIcon);
  });

  // ✅ 复制链接按钮逻辑
  copyButton.addEventListener('click', () => {
    const link = waLinkInput.value;
    navigator.clipboard.writeText(link)
      .then(() => {
        Swal.fire({
          toast: true,
          icon: 'success',
          title: 'Your URL is Copied!',
          position: 'top-end',
          timer: 1750,
          showConfirmButton: false
        });
      })
      .catch(err => {
        Swal.fire({
          icon: 'error',
          title: 'Copy Failed',
          text: 'You may copy Your URL manually.',
          showConfirmButton: true
        });
      });
  });

  // ✅ 生成二维码按钮逻辑
  qrButton.addEventListener('click', () => {
  const link = waLinkInput.value;
  exportSection.classList.remove('hidden');

  QRCode.toCanvas(qrCanvas, link, { width: 200 }, function (error) {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'QR Code Failed',
        text: 'Unable to generate QR code.',
        position: 'center',
        showConfirmButton: true,
        willClose: () => {
          document.activeElement?.blur({ preventScroll: true });
        }
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'QR Code Ready!',
        text: 'Your QR code has been generated.',
        position: 'center',
        timer: 1750,
        showConfirmButton: false,
        willClose: () => {
          document.activeElement?.blur({ preventScroll: true });
        },
        didClose: () => {
  setTimeout(() => {
    const offset = exportSection.offsetTop - 60; // 上方留 xx 空间
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }, 100);
}
      });
    }
  });
});
  
  // ✅ 分享按钮逻辑（占位）
  shareButton.addEventListener('click', () => {
    Swal.fire({
      icon: 'info',
      title: 'Coming Soon!',
      text: 'Share via WhatsApp, Telegram, Email will be available soon.',
      position: 'center',
      showConfirmButton: true
    });
  });

  // ✅ 手机号输入校验
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (!value.startsWith('+')) value = '+' + value;
    e.target.value = value;
  });

  // ✅ 表单提交：生成 WhatsApp 链接
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const phone = phoneInput.value.trim().replace(/[^\d+]/g, '');
    const message = document.getElementById('message').value.trim();
    const utm = document.getElementById('utm').value.trim();
    const includePageInfo = document.getElementById('includePageInfo').checked;

    if (!phone || !phone.startsWith('+')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Please enter a valid phone number with country code (e.g., +21 3456789)',
        position: 'center',
        showConfirmButton: true,
      });
      return;
    }

    let fullMessage = message;

    if (includePageInfo) {
      const pageTitle = document.title;
      const pageURL = window.location.href;
      fullMessage += `\n\nPage: ${pageTitle}\nURL: ${pageURL}`;
    }

    if (utm) {
      fullMessage += `\n\nCampaign: ${utm}`;
    }

    const encodedMessage = encodeURIComponent(fullMessage);
    const waLink = `https://wa.me/${phone.substring(1)}?text=${encodedMessage}`;

    waLinkInput.value = waLink;
    resultSection.classList.remove('hidden');

    // ✅ 生成链接按钮 可选：更新 Preview 按钮 href（如果你加了 preview-button）
    const previewBtn = document.getElementById('preview-button');
    if (previewBtn) previewBtn.href = waLink;

    Swal.fire({
      icon: 'success',
      title: 'WhatsApp URL Generated!',
      text: 'Your URL is ready to be copied.',
      position: 'center',
      showConfirmButton: false,
      timer: 1750,
  didClose: () => {
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile) {
      setTimeout(() => {
        window.scrollBy({ top: 100, behavior: 'smooth' });
      }, 100);
    }
  }
});
    });

  // ✅ 下载二维码按钮逻辑
  downloadQR.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ezlink-whatsapp-qr.png';
  link.href = qrCanvas.toDataURL();
  link.click();

  // ✅ 弹窗提示
  Swal.fire({
    icon: 'success',
    title: 'QR Code Downloaded!',
    text: 'Your QR code has been saved as an png-image.',
    position: 'center',
    timer: 1750,
    showConfirmButton: false
  });
});

  // ✅ 生成短链按钮逻辑（TinyURL）
  generateShortLink.addEventListener('click', async () => {
  const waLink = waLinkInput.value;
    // ✅ 显示 loading 弹窗
  Swal.fire({
    title: 'Generating Short Link...',
    text: 'Please wait a moment.',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch("https://smartlink-test.onrender.com/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: waLink })
    });

    const data = await res.json();
    shortLinkOutput.value = data.shortUrl;

    Swal.fire({
      icon: 'success',
      title: 'Short Link Ready!',
      text: 'You can now copy and share it.',
      position: 'center',
      timer: 1750,
      showConfirmButton: false
    });
  } catch (err) {
    console.error('Short link error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Short Link Failed',
      text: 'Unable to generate short link.',
      position: 'center',
      showConfirmButton: true
    });
  }
});
      });
  
