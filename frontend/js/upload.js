const uploadBox =
  document.getElementById("uploadBox");

const fileInput =
  document.getElementById("fileInput");

const previewImage =
  document.getElementById("previewImage");

const progressContainer =
  document.getElementById("uploadProgress");

const progressBar =
  document.getElementById("uploadProgressBar");

const progressText =
  document.getElementById("uploadProgressText");

const publishBtn =
  document.querySelector(".publish-btn");

const BASE_URL =
  window.APP_CONFIG?.BASE_URL ||
  "http://localhost:8080/api";

let uploadedImageUrl = "";

// 点击上传区域
uploadBox.addEventListener("click", () => {
  fileInput.click();
});

// 选择图片
fileInput.addEventListener("change", (e) => {

  const file = e.target.files[0];

  if (!file) return;

  window.selectedFile = file;
  uploadedImageUrl = "";

  // 本地预览
  const localUrl =
    URL.createObjectURL(file);

  previewImage.src = localUrl;
  previewImage.style.display = "block";

  const placeholder =
    document.querySelector(
      ".upload-placeholder"
    );

  if (placeholder) {
    placeholder.style.display = "none";
  }
});

// 发布作品
document
  .querySelector(".publish-btn")
  .addEventListener("click", async () => {

    try {

      const title =
        document
          .getElementById("title")
          .value
          .trim();

      const styleType =
        document
          .getElementById("styleType")
          .value;

      const content =
        document
          .getElementById("content")
          .value
          .trim();

      if (!window.selectedFile) {

        alert("请先选择图片");
        return;

      }

      if (
        !title ||
        !styleType ||
        !content
      ) {

        alert("请填写完整作品信息");
        return;

      }

      const token =
        localStorage.getItem(
          "token"
        );

        const compressedFile =
          await compressImage(
            window.selectedFile
          );

      // =====================
      // 第一步：上传图片到OSS，显示进度
      // =====================

      const formData =
        new FormData();

      formData.append(
        "image",
        compressedFile
      );

      showUploadProgress();
      setUploadProgress(0, "正在上传作品图片...");
      publishBtn.disabled = true;
      publishBtn.textContent = "上传中...";

      let uploadData;
      try {
        uploadData = await uploadFileWithProgress(
          `${BASE_URL}/upload/image`,
          formData,
          token,
          (percent) => {
            setUploadProgress(
              percent,
              `上传中 ${percent}%`
            );
          }
        );
      } catch (err) {
        hideUploadProgress();
        publishBtn.disabled = false;
        publishBtn.textContent = "发布作品";
        alert(err.message || "图片上传失败");
        return;
      }

      if (!uploadData || !uploadData.url) {
        hideUploadProgress();
        publishBtn.disabled = false;
        publishBtn.textContent = "发布作品";
        alert("图片上传失败");
        return;
      }

      uploadedImageUrl =
        uploadData.url;

      setUploadProgress(100, "图片上传完成，正在发布作品...");

      // =====================
      // 第二步：发布作品
      // =====================

      const publishRes =
        await fetch(
          `${BASE_URL}/work/upload`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                "Bearer " + token
            },
            body: JSON.stringify({
              title,
              style_type: styleType,
              content,
              image_url:
                uploadedImageUrl
            })
          }
        );

      const publishData =
        await publishRes.json();

      if (publishRes.ok) {

        setUploadProgress(
          100,
          "发布成功，正在跳转..."
        );

        setTimeout(() => {
          window.location.href =
            "./index.html";
        }, 500);

      } else {

        alert(
          publishData.message ||
          "发布失败"
        );

      }

    } catch (err) {

      console.error(err);

      hideUploadProgress();
      publishBtn.disabled = false;
      publishBtn.textContent = "发布作品";

      alert(
        "网络异常，请稍后重试"
      );

    }
  });

async function uploadFileWithProgress(
  url,
  formData,
  token,
  onProgress
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);
    xhr.setRequestHeader(
      "Authorization",
      "Bearer " + token
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round(
          (event.loaded / event.total) * 100
        );
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (error) {
          reject({
            message:
              "上传结果解析失败"
          });
        }
      } else {
        let errorData;
        try {
          errorData = JSON.parse(xhr.responseText);
        } catch {
          errorData = {
            message:
              xhr.statusText ||
              "上传失败"
          };
        }
        reject(errorData);
      }
    };

    xhr.onerror = () => {
      reject({
        message:
          "图片上传失败，请检查网络"
      });
    };

    xhr.send(formData);
  });
}

function setUploadProgress(
  percent,
  text
) {
  if (progressBar) {
    progressBar.style.width =
      `${percent}%`;
  }
  if (progressText) {
    progressText.textContent =
      text;
  }
}

function showUploadProgress() {
  if (progressContainer) {
    progressContainer.classList.remove(
      "hidden"
    );
  }
}

function hideUploadProgress() {
  if (progressContainer) {
    progressContainer.classList.add(
      "hidden"
    );
  }
  if (progressBar) {
    progressBar.style.width = "0%";
  }
}

// 阻止表单默认提交
document.addEventListener(
  "submit",
  (e) => {
    e.preventDefault();
  }
);

// 返回按钮
document
  .querySelector(".back-btn")
  .addEventListener(
    "click",
    () => {
      window.location.href =
        "./index.html";
    }
  );

  async function compressImage(file) {

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = (e) => {

      const img = new Image();

      img.onload = () => {

        const canvas =
          document.createElement("canvas");

        const maxWidth = 1200;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {

          height =
            height *
            (maxWidth / width);

          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {

            resolve(
              new File(
                [blob],
                file.name,
                {
                  type:
                    "image/jpeg"
                }
              )
            );

          },
          "image/jpeg",
          0.8
        );
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}