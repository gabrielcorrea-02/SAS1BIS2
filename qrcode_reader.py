import cv2
from pyzbar.pyzbar import decode
import time
import numpy as np
# import winsound
import requests
from urllib.parse import urlparse, parse_qs

COOLDOWN_SECONDS = 5
BEEP_DURATION = 150

session = requests.Session()


# -----------------------------------------------------
# LOGIN
# -----------------------------------------------------
def login(username, password, login_url):
    payload = {
        "username": username,
        "password": password
    }

    print(f"Tentando login em {login_url} ...")

    try:
        response = session.post(login_url, json=payload)
        print("Login status:", response.status_code)

        if response.status_code != 200:
            print("❌ Login falhou:", response.text)
            return False

        print("✔ Login realizado com sucesso.")
        return True

    except Exception as e:
        print("Erro ao conectar login:", e)
        return False


# -----------------------------------------------------
# CAMERA
# -----------------------------------------------------
def draw_triangle(frame, pts, color=(0, 255, 0), thickness=2):
    pts = pts.reshape(-1, 2)
    for i in range(len(pts)):
        pt1 = tuple(pts[i])
        pt2 = tuple(pts[(i + 1) % len(pts)])
        cv2.line(frame, pt1, pt2, color, thickness)


def get_available_camera():
    for i in range(1, 4):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"Usando webcam externa: {i}")
            return cap
        cap.release()

    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        print("Usando webcam padrão (0)")
        return cap

    return None


# -----------------------------------------------------
# QR VALIDATION + EXTRACTION
# -----------------------------------------------------
def check_qr_url(url):
    """GET the QR URL and ensure server returns HTTP 200."""
    try:
        r = session.get(url)
        print(f"[QR GET] {url} → {r.status_code}")
        return r.status_code == 200
    except Exception as e:
        print("Erro ao verificar QR URL:", e)
        return False


def extract_payload_from_qr(url):
    """
    NEW LOGIC:
    URL structure:
        http://localhost:3000/cp/lookup?id=UUID
                       ↑
                     type (cp or guests)

    cp    → corpo_permanente_id
    guests → visitante_id
    """

    parsed = urlparse(url)

    # 1. Extract type from URL path
    path_parts = parsed.path.strip("/").split("/")
    # Example: ["cp", "lookup"] → type = "cp"
    if len(path_parts) < 2:
        print("❌ Caminho do QR inválido:", parsed.path)
        return None, None, None

    qr_type = path_parts[0]  # cp or guests

    # 2. Extract ID from query parameter
    params = parse_qs(parsed.query)
    qr_id = params.get("id", [None])[0]

    if not qr_id:
        print("❌ QR Code sem parâmetro 'id'.")
        return None, None, None

    # Build base URL like: http://localhost:3000
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    return qr_type, qr_id, base_url


def generate_access_payload(qr_type, qr_id):
    """Build JSON based on extracted QR type."""
    payload = {
        "visitante_id": None,
        "corpo_permanente_id": None
    }

    if qr_type == "guests":
        payload["visitante_id"] = qr_id

    elif qr_type == "cp":
        payload["corpo_permanente_id"] = qr_id

    else:
        print("❌ Tipo desconhecido no QR:", qr_type)
        return None

    return payload


def post_access_auto(base_url, payload):
    url = base_url + "/access/auto"
    print(url)
    try:
        r = session.post(url, json=payload)
        print("→ POST /access/auto", r.status_code)
        print("Resposta:", r.text)
    except Exception as e:
        print("Erro no POST /access/auto:", e)


# -----------------------------------------------------
# MAIN LOOP
# -----------------------------------------------------
def main():
    # -------------------------------
    # LOGIN FIRST
    # -------------------------------
    LOGIN_URL = "http://localhost:3000/login"  # ← put your login route
    USERNAME = "admin"
    PASSWORD = "admin"

    if not login(USERNAME, PASSWORD, LOGIN_URL):
        return

    # -------------------------------
    # CAMERA
    # -------------------------------
    cap = get_available_camera()
    if not cap:
        print("❌ Nenhuma webcam encontrada!")
        return

    print("\n🔍 Escaneando... aponte um QR Code para a câmera.\n")
    recent_qrcodes = {}

    # -------------------------------
    # LOOP
    # -------------------------------
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        codes = [c for c in decode(frame) if c.type == "QRCODE"]
        current_time = time.time()

        for code in codes:
            qr_url = code.data.decode("utf-8")
            points = code.polygon

            points = code.polygon
            if points:
                pts = np.array([[p.x, p.y] for p in points], np.int32)

            last_scan = recent_qrcodes.get(qr_url, 0)
            elapsed = current_time - last_scan
            can_process = elapsed > COOLDOWN_SECONDS

            color = (0, 255, 0) if can_process else (0, 0, 255)
            draw_triangle(frame, pts, color=color, thickness=3)

            if can_process:

                # 1) GET QR URL
                if not check_qr_url(qr_url):
                    cooldown_text = "GET falhou"
                    recent_qrcodes[qr_url] = current_time
                    continue

                # 2) Extract type & id
                qr_type, qr_id, base_url = extract_payload_from_qr(qr_url)
                if not qr_type or not qr_id:
                    cooldown_text = "QR inválido"
                    continue

                # 3) Create JSON
                payload = generate_access_payload(qr_type, qr_id)
                if payload is None:
                    cooldown_text = "Tipo inválido"
                    continue

                # 4) POST /access/auto
                print(base_url, payload)
                post_access_auto(base_url, payload)

                # winsound.Beep(BEEP_FREQUENCY, BEEP_DURATION)
                recent_qrcodes[qr_url] = current_time
                cooldown_text = "Enviado!"

            else:
                cooldown_text = f"Cooldown {int(COOLDOWN_SECONDS - elapsed)}s"

            x = code.rect.left
            y = code.rect.top - 10

            cv2.putText(frame,
                        f"{qr_url} ({cooldown_text})",
                        (x, max(y, 20)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        color,
                        2)

        cv2.imshow("QR Scanner Profissional", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
