# مرحلة واحدة بسيطة كبداية – نقدر نحسنها بعدين
FROM python:3.12-slim

# منع Python من عمل ملفات .pyc وتخزين الـ buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# إنشاء مستخدم غير root (أفضل أمنيًا)
RUN useradd -ms /bin/bash appuser

# إنشاء مجلد العمل
WORKDIR /app

# تثبيت بعض الأدوات الأساسية والتحديثات الخفيفة
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# أولاً: نسخ requirements عشان نستخدم layer caching
COPY requirements.txt .

# تثبيت المتطلبات
RUN pip install --no-cache-dir -r requirements.txt

# نسخ باقي ملفات المشروع
COPY . .

# تغيير مالك الملفات للمستخدم غير الـ root
RUN chown -R appuser:appuser /app

# التحويل للمستخدم غير الـ root
USER appuser

# البورت اللي التطبيق بيسمع عليه
EXPOSE 8000

# الأمر الافتراضي لتشغيل التطبيق
CMD ["python", "app.py"]