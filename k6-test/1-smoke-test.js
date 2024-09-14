import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://host.docker.internal:3333';
// const BASE_URL = 'https://swapi.dev/api/people/30';

// See https://k6.io/docs/using-k6/k6-options/
export const options = {
  vus: 3,
  duration: '30s',
  ext: {
    loadimpact: {
      name: 'Smoke Test',
    },
  },
};

export default function () {
  const data = {
    email: `fakee${Math.random()}@test.com`,
    password: `pass${Math.random()}`,
  };
  let loginRes = http.post(`${BASE_URL}/auth/signup`, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'success signup': (r) => r.status === 201 });
  console.log(
    `Status Code: ${loginRes.status} - Response Body: ${loginRes.body}`,
  );
  sleep(1);
}
