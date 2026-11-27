jest.unmock('../utils/sendEmail');

const nodemailer = require('nodemailer');
const sendEmail = jest.requireActual('../utils/sendEmail');

describe('sendEmail (nodemailer 10)', () => {
  const original = { ...process.env };
  let sent;
  let createSpy;

  beforeEach(() => {
    process.env.EMAIL_HOST = 'smtp.example.test';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'user';
    process.env.EMAIL_PASS = 'pass';
    process.env.EMAIL_FROM = 'noreply@example.test';

    const jsonTransport = nodemailer.createTransport({ jsonTransport: true });
    const realSendMail = jsonTransport.sendMail.bind(jsonTransport);
    sent = [];
    jsonTransport.sendMail = async (message) => {
      const info = await realSendMail(message);
      sent.push(JSON.parse(info.message));
      return info;
    };
    createSpy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue(jsonTransport);
  });

  afterEach(() => {
    createSpy.mockRestore();
    process.env = { ...original };
  });

  it('sends a message with the expected fields', async () => {
    await expect(
      sendEmail({ email: 'to@example.test', subject: 'Hello', message: 'Body text' })
    ).resolves.toBeUndefined();

    expect(sent).toHaveLength(1);
    expect(sent[0].from.address).toBe('noreply@example.test');
    expect(sent[0].from.name).toBe('Ecommerce App');
    expect(sent[0].to[0].address).toBe('to@example.test');
    expect(sent[0].subject).toBe('Hello');
    expect(sent[0].text).toBe('Body text');
  });

  it('passes a numeric port and sets secure only for 465', async () => {
    await sendEmail({ email: 'to@example.test', subject: 's', message: 'm' });
    let opts = createSpy.mock.calls[0][0];
    expect(opts.port).toBe(587);
    expect(typeof opts.port).toBe('number');
    expect(opts.secure).toBe(false);
    expect(opts.host).toBe('smtp.example.test');
    expect(opts.auth).toEqual({ user: 'user', pass: 'pass' });

    process.env.EMAIL_PORT = '465';
    await sendEmail({ email: 'to@example.test', subject: 's', message: 'm' });
    opts = createSpy.mock.calls[1][0];
    expect(opts.port).toBe(465);
    expect(opts.secure).toBe(true);
  });
});
