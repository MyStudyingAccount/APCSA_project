package robot;

import kareltherobot.*;

public class Roomba implements Directions {

	public static void main(String[] args) {
		String worldName = "robot/basicRoom.wld";

		Roomba cleaner = new Roomba();
		int totalBeepers = cleaner.cleanRoom(worldName, 7, 6);
		System.out.println("Roomba cleaned up a total of " + totalBeepers + " beepers.");

	}

	private Robot roomba = new Robot(7, 6, North, 67);

	public int cleanRoom(String worldName, int startX, int startY) {

		World.readWorld(worldName);
		World.setVisible(true);
		World.setDelay(1);
		int totalBeepers = 0;
		roomba.turnLeft();
		roomba.turnLeft();
		roomba.turnLeft();
		boolean finish=false;
		while (!finish) {
			
			while (roomba.frontIsClear()) {
			
				while (roomba.nextToABeeper()) {
					roomba.pickBeeper();
					totalBeepers++;
				}
				roomba.move();
			}
			if(roomba.facingEast()) {
				roomba.turnLeft();
				if (roomba.frontIsClear()) {
					roomba.move();
				}
				else
				{
					break;
				}
				while (roomba.nextToABeeper()) {
					roomba.pickBeeper();
					totalBeepers++;
				}
				roomba.turnLeft();
			}
			else
			{
				roomba.turnLeft();
				roomba.turnLeft();
				roomba.turnLeft();
				if (roomba.frontIsClear()) {
					roomba.move();
				}
				else
				{
					break;
				}
				while (roomba.nextToABeeper()) {
					roomba.pickBeeper();
					totalBeepers++;
				}
				roomba.turnLeft();
				roomba.turnLeft();
				roomba.turnLeft();
			}
		}
		return totalBeepers;
	}
}