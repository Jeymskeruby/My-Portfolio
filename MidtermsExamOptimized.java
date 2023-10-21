import java.util.Scanner;
public class MidtermsExamOptimized {

	public static void main(String[] args) {
		Scanner scan = new Scanner(System.in);
		
		int MWH = 40;
		double OTF, OTH;
		
		System.out.print("Employee Name: ");
		String name = scan.nextLine();
		
		System.out.print("No. of hours worked: ");
		int Whours = scan.nextInt();
		
		if (MWH < Whours) {
			OTH = (Whours) - 40; 
			OTF = OTH * (76.25*1.2);
		} else {
			OTF = 0;
			OTH = 0;
		}
		double Ncome = 40 * 76.25 + (OTF);
		double SSS = (Ncome) * 0.0825;
		double PH = (Ncome) * 0.0775;
		double PI = (Ncome) * 0.0625;
		double TAX = (Ncome) * 0.12;
		double TD = SSS + PH + PI + TAX;
		double NP = Ncome - TD;
		
		System.out.println("Employee Name: "+ name);
		System.out.println("No. of hours worked: "+ Whours);
		System.out.println("Net Income: ito "+ Ncome);
		if (MWH < Whours) {
			System.out.println("Overtime Hour/s: "+ OTH);
			System.out.println("Overtime Fee/s: "+ OTF);
		}
		System.out.println("SSS: "+ SSS);
		System.out.println("PH: "+ PH);
		System.out.println("PI: "+ PI);
		System.out.println("TAX: "+ TAX);
		System.out.println("Total Deduction: "+ TD);
		System.out.println("Net Pay: "+ NP);

		
	}
}
