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
  const csvUpload = document.getElementById('csvUpload');
  const bulkToggle = document.getElementById('bulkToggle');
const bulkSection = document.getElementById('bulkSection');
const bulkIcon = bulkToggle.querySelector('svg');
  let bulkData = []; // ✅ 全局变量，供导出 CSV 使用
  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const bulkResults = document.getElementById('bulkResults');
const bulkTableContainer = document.getElementById('bulkTableContainer');
  
  // 👉Bulk Create 的主处理函数 handleCSVUpload(file)
  async function handleCSVUpload(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async function(results) {
      const rows = results.data;
      const output = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const { isValid, errors, parsed } = validateRow(row);

        if (!isValid) {
          output.push({
            index: i + 1,
            phone: row['WhatsApp number'],
            message: row['custom message'],
            status: '❌ Error',
            errors,
            shortUrl: '',
            qrCode: '',
            remark: row['remark'] || ''
          });
          continue;
        }

        const waLink = generateWhatsAppLink(parsed);
        const { shortUrl, error } = await generateShortLinkBulk(waLink, parsed.alias);

        output.push({
          index: i + 1,
          phone: parsed.phone,
          message: parsed.message,
          status: error ? '❌ Failed' : '✅ Success',
          errors: error ? [error] : [],
          shortUrl,
          qrCode: parsed.qr ? shortUrl : '',
          remark: parsed.remark
        });
      }

      renderBulkResults(output);
    },
    error: function(err) {
      Swal.fire({
        icon: 'error',
        title: 'CSV Parse Failed',
        text: err.message,
        position: 'center',
        showConfirmButton: true
      });
    }
  });
}

  // 👉动态生成并下载 CSV 文件
downloadTemplateBtn.addEventListener('click', () => {
  const csvHeader = [
    'WhatsApp number',
    'custom message',
    'utm_campaign',
    'custom_alias',
    'remark'
  ];

  const sampleRows = [
    ['+60123456789', 'Hello Sir', 'october_sale', 'john123',  'VIP client'],
    ['+65987654321', 'Welcome!', 'referral_kelly', 'promo88',  'Test batch']
  ];

  const csvContent = [csvHeader, ...sampleRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ezlink-bulk-create-WA-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.fire({
    icon: 'success',
    title: 'Template Downloaded!',
    text: 'Your CSV template is ready, Please filled it and upload.',
    position: 'center',
    timer: 2000,
    showConfirmButton: false
  });
});
  
  
// 👉bulk create toggled
bulkToggle.addEventListener('click', () => {
  toggleSection(bulkSection, bulkIcon);
});

csvUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      console.log('📦 CSV 解析结果：', results.data); // 每行数据是一个对象
      handleParsedRows(results.data);
      // 👉 接下来你可以对每行调用 validateRow(row)、generateWhatsAppLink(row) 等函数
    },
    error: function(err) {
      Swal.fire({
        icon: 'error',
        title: 'CSV 解析失败',
        text: err.message,
        position: 'center',
        showConfirmButton: true
      });
    }
  });
});
  
  // 👉handleParsedRows(rows) 完整代码
  async function handleParsedRows(rows) {
  const bulkResults = document.getElementById('bulkResults');

  const output = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { isValid, errors, parsed } = validateRow(row);

    if (!isValid) {
      output.push({
        index: i + 1,
        phone: row['WhatsApp number'],
        message: row['custom message'],
        status: '❌ Error',
        errors,
        shortUrl: '',
        //qrCode: '',
        remark: row['remark'] || ''
      });
      continue;
    }

    const waLink = generateWhatsAppLink(parsed);
    const { shortUrl, error } = await generateShortLinkBulk(waLink, parsed.alias);

    output.push({
      index: i + 1,
      phone: parsed.phone,
      message: parsed.message,
      status: error ? 'Failed' : 'Success',
      errors: error ? [error] : [],
      shortUrl,
      //qrCode: parsed.qr ? shortUrl : '',// 👈 暂时移除
      remark: parsed.remark
    });
  }

  renderBulkResults(output);
    bulkData = output; // ✅ 保存结果供导出使用
}
  
  // 👉bulk create 批量处理逻辑
  function validateRow(row) {
  const errors = [];

  const phone = row['WhatsApp number']?.trim();
  const message = row['custom message']?.trim();
  const alias = row['custom_alias']?.trim();
  const utm = row['utm_campaign']?.trim();
  //const qr = row['qr_code']?.trim();// 👈 暂时移除

  if (!phone || !/^\+\d{8,15}$/.test(phone)) {
    errors.push('Invalid phone number');
  }

  if (!message || message.length < 2) {
    errors.push('Message is required');
  }

  if (alias && !/^[a-zA-Z0-9_-]{3,20}$/.test(alias)) {
    errors.push('Invalid custom alias');
  }

  if (utm && !/^[a-zA-Z0-9_-]+$/.test(utm)) {
    errors.push('Invalid UTM campaign');
  }

  //const qrBool = /^(1|yes)$/i.test(qr);// 👈 暂时移除

  return {
    isValid: errors.length === 0,
    errors,
    parsed: {
      phone,
      message,
      alias,
      utm,
      //qr: qrBool,// 👈 暂时移除
      remark: row['remark']?.trim() || ''
    }
  };
}
  
  function generateWhatsAppLink({ phone, message, utm }) {
  let fullMessage = message;

  if (utm) {
    fullMessage += `\n\nCampaign: ${utm}`;
  }

  const encoded = encodeURIComponent(fullMessage);
  return `https://wa.me/${phone.replace('+', '')}?text=${encoded}`;
}
  
  async function generateShortLinkBulk(originalUrl, alias = '') {
  const payload = { originalUrl };
  if (alias) payload.customAlias = alias;

  try {
    const res = await fetch("https://smartlink-test.onrender.com/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return { shortUrl: data.shortUrl || '', error: null };
  } catch (err) {
    return { shortUrl: '', error: err.message };
  }
}
  
 function renderBulkResults(rows) {
  const bulkResults = document.getElementById('bulkResults');
  const container = document.getElementById('bulkTableContainer');
  const exportBtn = document.getElementById('exportCSV');

  // ✅ 显示结果区块和导出按钮
  bulkResults.classList.remove('hidden');
  exportBtn.classList.remove('hidden');

  // ✅ 自动滚动到结果区块
  bulkResults.scrollIntoView({ behavior: 'smooth' });

  // ✅ 构建表格
  const table = document.createElement('table');
  table.className = 'min-w-full table-auto border border-gray-300 text-sm';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr class="bg-gray-100 text-left">
      <th class="px-3 py-2 border">#</th>
      <th class="px-3 py-2 border">Phone</th>
      <th class="px-3 py-2 border">Message</th>
      <th class="px-3 py-2 border">Status</th>
      <th class="px-3 py-2 border">Short Link</th>
      <th class="px-3 py-2 border">Remark</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  rows.forEach(row => {
    const tr = document.createElement('tr');
tr.className = row.status === 'Success' ? 'bg-white' : 'bg-red-50';

    tr.innerHTML = `
      <td class="px-3 py-2 border">${row.index}</td>
      <td class="px-3 py-2 border">${row.phone}</td>
      <td class="px-3 py-2 border">${row.message}</td>
      <td class="px-3 py-2 border">
  <span class="${row.status === 'Success' ? 'text-green-600' : 'text-red-600'} font-semibold">
    ${row.status}
  </span>
</td>
      <td class="px-3 py-2 border">
        ${row.shortUrl
          ? `<input type="text" value="${row.shortUrl}" readonly class="bg-gray-100 px-2 py-1 w-full rounded text-xs" />`
          : '<span class="text-gray-400 italic">N/A</span>'}
      </td>
      <td class="px-3 py-2 border">${row.remark || ''}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}
  
  csvUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // ⏳ 显示处理状态
  bulkResults.classList.remove('hidden');
  bulkTableContainer.innerHTML = `
  <div class="w-full text-left px-2 py-2">
    <div class="flex items-center gap-2 text-gray-500 italic">
      <svg class="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span>Generating CSV rows...</span>
    </div>
  </div>
`;

  // 📦 解析 CSV 并处理
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      handleParsedRows(results.data);
    },
    error: function(err) {
      Swal.fire({
        icon: 'error',
        title: 'CSV Parse Failed!',
        text: err.message,
        position: 'center',
        showConfirmButton: true
      });
    }
  });
});
  
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
 // 👉导出结果为 CSV 文件
  const exportCSVBtn = document.getElementById('exportCSV');

  
  // 👉用bulk data导出
exportCSVBtn.addEventListener('click', () => {
  if (!bulkData.length) return;

  const headers = ['Phone', 'Message', 'Status', 'Short Link', 'Remark'];
  const rows = bulkData.map((row, index) => [
    index + 1, // 👈 加上序号
    row.phone,
    row.message,
    row.status,
    row.shortUrl || '',
    row.remark || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'ezlink-bulk-create-WA-results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.fire({
    icon: 'success',
    title: 'CSV File Exported!',
    text: 'Your results have been saved to file.',
    position: 'top-end',
    timer: 1750,
    showConfirmButton: false
  });
});
  
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
  form.addEventListener('submit', async (e) => {
  e.preventDefault();

    const phone = phoneInput.value.trim().replace(/[^\d+]/g, '');
    const isValidPhone = /^\+\d{8,15}$/.test(phone);
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
    if (!isValidPhone) {
      phoneInput.classList.add('input-error');
setTimeout(() => phoneInput.classList.remove('input-error'), 500); // 自动移除
      
  Swal.fire({
    icon: 'error',
    title: 'Invalid Phone Number',
    text: 'Please enter a valid phone number including country code.',
    position: 'center',
    showConfirmButton: true,
    didClose: () => {
      phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneInput.focus();
    }
  });
  return;
}
if (!message) {
  messageInput.classList.add('input-error');
  setTimeout(() => messageInput.classList.remove('input-error'), 3000);

  Swal.fire({
    icon: 'error',
    title: 'Message Required',
    text: 'Please fill out your message before generating the link.',
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

    waLinkInput.value = 'Generating...'; // ✅ 提示用户正在生成短链

    // ✅ 生成链接按钮 可选：更新 Preview 按钮 href（如果你加了 preview-button）
    // ✅ 生成短链按钮逻辑（smartlink-test/TinyURL）
    const previewBtn = document.getElementById('preview-button');
    if (previewBtn) previewBtn.href = waLink;

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
    waLinkInput.value = data.shortUrl; // ✅ 显示短链
    resultSection.classList.remove('hidden');

    Swal.fire({
      icon: 'success',
      title: 'WhatsApp Link Generated!',
      text: 'Your short link is ready to be copied.',
      position: 'center',
      timer: 1750,
      showConfirmButton: false,
      didClose: () => {
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        if (isMobile) {
          setTimeout(() => {
            window.scrollBy({ top: 100, behavior: 'smooth' });
          }, 100);
        }
      }
    });
  } catch (err) {
    console.error('Short link error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Generate Link Failed',
      text: 'Unable to generate short link.',
      position: 'center',
      showConfirmButton: true
    });
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


  
