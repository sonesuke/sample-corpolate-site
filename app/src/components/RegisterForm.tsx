import { useForm, type SubmitHandler } from "react-hook-form";

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  campaignId: string;
};

type Props = {
  campaignId: string;
  status: string;
};

export default function RegisterForm(props: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    console.log(data);
    // const endpoint = "/api/register";
    const endpoint = "https://d2cxr6wvupr465.cloudfront.net/api/register";
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => {
      console.log(res);
      if (res.ok) {
        props.status = "success";
      }
    });
  };

  return (
    <div className="max-w-[640px] w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 placeholder:text-gray-400 w-full"
      >
        <div className="flex flex-col">
          <label className="text-sm" htmlFor="first-name">
            First Name
          </label>
          <input
            id="first-name"
            type="text"
            placeholder="Enter your first name"
            {...register("firstName", {
              required: true,
              maxLength: 20,
            })}
          />
          {errors.firstName && (
            <div className="text-red-500">This field is required</div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm" htmlFor="last-name">
            Last Name
          </label>
          <input
            id="last-name"
            type="text"
            placeholder="Enter your last name"
            {...register("lastName", {
              required: true,
              maxLength: 20,
            })}
          />
          {errors.lastName && (
            <div className="text-red-500">This field is required</div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: true,
              pattern: /^[\w\-._]+@[\w\-._]+\.[A-Za-z]+/,
            })}
          />
          {errors.email && (
            <div className="text-red-500">This field is required</div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm" htmlFor="company">
            Company
          </label>
          <input
            id="company"
            type="text"
            placeholder="Enter your company name"
            {...register("company", {
              required: true,
              maxLength: 20,
            })}
          />
          {errors.company && (
            <div className="text-red-500">This field is required</div>
          )}
        </div>

        <input
          value={props.campaignId}
          className="hidden"
          type="text"
          {...register("campaignId")}
        />
        <input type="submit" className="bg-orange-500 text-white py-2" />
      </form>
    </div>
  );
}
